# AKC Scent Work Module - Fixes Needed

**Date:** 2025-12-21
**Based on:** Bugs discovered during UKC Nosework v3 testing

## Summary

The AKC module has the same VBA bugs as UKC, but they haven't triggered yet because AKC has established data (shows/trials already exist in Supabase). These bugs will cause failures when:
- Creating a brand new show
- First-time trial upload
- Any scenario where GetSupabaseShowID/TrialID needs to parse fresh API responses

## Bug 1: VBA Short-Circuit Evaluation

**Location:** `GetSupabaseShowID_v3`, `GetSupabaseTrialID_v3`, `GetSupabaseClassID_v3`

**Problem:** VBA's `And` operator does NOT short-circuit. This code crashes:
```vba
If Not parsedJson Is Nothing And parsedJson.count > 0 Then
```
When `parsedJson` is `Nothing`, VBA still evaluates `parsedJson.count` causing "Object required" error.

**Fix:** Use nested If statements:
```vba
If Not parsedJson Is Nothing Then
    If parsedJson.count > 0 Then
        ' Safe to access parsedJson properties
    End If
End If
```

**Affected lines:** Search for `And parsedJson.count` or similar patterns.

---

## Bug 2: CLng Cannot Convert Decimal

**Location:** All `GetSupabase*ID_v3` functions

**Problem:** Supabase returns `id` as bigint (bigserial). VBA-JSON stores this as Decimal type. `CLng()` cannot convert Decimal directly, causing "Type mismatch" (Error 13).

**Fix:** Use `Val()` to convert to Double first:
```vba
' Before (crashes):
GetSupabaseShowID_v3 = CLng(parsedJson(1)("id"))

' After (works):
GetSupabaseShowID_v3 = CLng(Val(firstItem("id")))
```

---

## Bug 3: VBA-JSON Dictionary Structure

**Location:** All `GetSupabase*ID_v3` functions

**Problem:** VBA-JSON returns arrays as Dictionary with numeric keys (1, 2, 3...), not as a true array. Direct access like `parsedJson(1)("id")` may fail.

**Fix:** Use `.Keys()` to get the first key:
```vba
Dim firstKey As Variant
firstKey = parsedJson.Keys()(0)
Dim firstItem As Object
Set firstItem = parsedJson(firstKey)
GetSupabaseShowID_v3 = CLng(Val(firstItem("id")))
```

---

## Bug 4: VBA-JSON Multi-Line Array Parsing

**Location:** `SyncEntriesViaAPI_v3` - class ID mapping section

**Problem:** When Supabase returns multi-line JSON arrays like:
```json
[{"id":123,"access_class_id":30},
 {"id":124,"access_class_id":31}]
```
VBA-JSON only parses the LAST item. `parsedJson.count` returns 1 instead of 2.

**Impact:** Only entries for the last class get uploaded; other classes are skipped.

**Fix:** Replace VBA-JSON parsing with manual string parsing:
```vba
' Extract all {"id":XXX,"access_class_id":YYY} pairs from response text
Dim responseText As String
responseText = http.responseText

Dim pos As Long, endPos As Long
Dim idVal As String, accessIdVal As String
pos = 1
Do While True
    pos = InStr(pos, responseText, """id"":")
    If pos = 0 Then Exit Do
    pos = pos + 5
    endPos = InStr(pos, responseText, ",")
    If endPos = 0 Then endPos = InStr(pos, responseText, "}")
    idVal = Trim(Mid(responseText, pos, endPos - pos))

    pos = InStr(pos, responseText, """access_class_id"":")
    If pos = 0 Then Exit Do
    pos = pos + 18
    endPos = InStr(pos, responseText, "}")
    If endPos = 0 Then Exit Do
    accessIdVal = Trim(Mid(responseText, pos, endPos - pos))

    classIdMap(accessIdVal) = CLng(Val(idVal))
    pos = endPos
Loop
```

---

## Enhancement: Update Show Details Fields

**Location:** `SyncShowViaAPI_v3` or "Update Show Details" function

**Problem:** The "Update Show Details" function may not be syncing all relevant fields.

**Required fields to sync:**
- `show_name` - Show name
- `club_name` - Club/Host name
- `start_date` - Event start date
- `end_date` - Event end date

**Note:** Verify the SQL query and JSON building in the show sync function includes these fields mapped from:
- `tbl_Show.ShowName` → `show_name`
- `tbl_Show.ClubName` → `club_name`
- `tbl_Show.StartDate` → `start_date`
- `tbl_Show.EndDate` → `end_date`

---

## Implementation Checklist

- [x] Fix Bug 1: VBA short-circuit in GetSupabaseShowID_v3 *(completed 2025-12-21)*
- [x] Fix Bug 1: VBA short-circuit in GetSupabaseTrialID_v3 *(completed 2025-12-21)*
- [x] Fix Bug 1: VBA short-circuit in GetSupabaseClassID_v3 *(completed 2025-12-21)*
- [x] Fix Bug 2: CLng(Val(...)) conversion in all GetSupabase*ID functions *(completed 2025-12-21)*
- [x] Fix Bug 3: Dictionary key access in all GetSupabase*ID functions *(completed 2025-12-21)*
- [x] Fix Bug 4: Replace VBA-JSON with string parsing in SyncEntriesViaAPI_v3 *(completed 2025-12-21)*
- [x] Remove cleanup references to `parsedJson` and `classItem` in SyncEntriesViaAPI_v3 Exit_Sub *(completed 2025-12-21)*
- [ ] Verify Update Show Details syncs: show_name, club_name, start_date, end_date
- [ ] Test with new show creation
- [ ] Test with new trial creation

## Reference

See the working UKC module for complete fix implementations:
`docs/access-integration/ukc-nosework/mod_myK9Qv3.bas`
