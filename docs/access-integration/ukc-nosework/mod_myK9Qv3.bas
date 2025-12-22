Attribute VB_Name = "mod_myK9Qv3"
Option Compare Database
Option Explicit

' ==========================================================================
' mod_myK9Qv3 - myK9Q v3 API Integration Module (UKC NOSEWORK)
' ==========================================================================
'
' ADAPTED FROM AKC SCENT WORK MODULE FOR UKC NOSEWORK
'
' KEY DIFFERENCES FROM AKC:
' -------------------------
' 1. Organization: "UKC Nosework" (not "AKC Scent Work")
' 2. Division field instead of Section (Division A/B in UKC)
' 3. Single area (always area_count = 1)
' 4. Single time limit (no area2/area3 time limits)
' 5. Dual timer system:
'    - SearchTime (pausable) - Used for placements
'    - ElementTime (continuous) - Total elapsed time against time limit
'
' UKC LEVELS: Novice, Advanced, Superior, Excellent, Master, Elite
' UKC ELEMENTS: Containers, Interior, Exterior, Vehicle, Handler Discrimination
'
' REQUIRED FORM: dlg_ScoredEntriesWarning
' ----------------------------------------
' This module requires a custom form named "dlg_ScoredEntriesWarning" for
' displaying scored entries warnings with clear button labels.
'
' Form Requirements:
'   - Name: dlg_ScoredEntriesWarning
'   - Pop Up: Yes, Modal: Yes, Border Style: Dialog
'   - Public variable: ReturnValue As Integer
'   - Controls: lblClassName (Label), txtEntryList (TextBox), lblTitle (Label),
'               lblMessage (Label), btnCancel, btnKeepScores, btnOverwrite (Command Buttons)
'   - Button handlers set ReturnValue (0=Cancel, 1=Keep, 2=Overwrite)
'     and use Me.Visible = False (NOT DoCmd.Close)
'
' OpenArgs Format:
'   UPLOAD (protecting myK9Q scores): "ClassName|EntryList"
'   DOWNLOAD (protecting Access scores): "ACCESS|ClassName|EntryList"
'
' Form_Load should check if Left(Me.OpenArgs, 7) = "ACCESS|" to determine mode:
'   - UPLOAD mode: Title = "Scored Entries Found"
'                  Message = "These scores are PROTECTED in myK9Q..."
'                  btnKeepScores.Caption = "Keep myK9Q Scores"
'                  btnOverwrite.Caption = "Overwrite myK9Q Scores"
'   - DOWNLOAD mode: Title = "Scored Entries Found"
'                    Message = "These scores are PROTECTED in Access..."
'                    btnKeepScores.Caption = "Keep Access Scores"
'                    btnOverwrite.Caption = "Overwrite Access Scores"
'
' See docs/access-integration/README.md for form setup instructions.
'
' ==========================================================================
' === SUPABASE CONFIGURATION
' ==========================================================================

Private Const SUPABASE_URL_2 As String = "https://yyzgjyiqgmjzyhzkqdfx.supabase.co"
Private Const SUPABASE_KEY_2 As String = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emdqeWlxZ21qenloemtxZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjYzMzIsImV4cCI6MjA3MDYwMjMzMn0.vXgwI9HyBMiH-t6WP13unRgFVc9rg3khDRNdhIedWqs"

' ==========================================================================
' === SHARED UTILITY FUNCTIONS
' ==========================================================================

Private Function JsonSafe(ByVal strInput As String) As String
    ' Escapes special characters for JSON string values
    Dim strOutput As String
    strOutput = strInput

    ' Escape backslashes first (must be first!)
    strOutput = Replace(strOutput, "\", "\\")
    ' Escape double quotes
    strOutput = Replace(strOutput, """", "\""")
    ' Escape newlines
    strOutput = Replace(strOutput, vbCrLf, "\n")
    strOutput = Replace(strOutput, vbCr, "\n")
    strOutput = Replace(strOutput, vbLf, "\n")
    ' Escape tabs
    strOutput = Replace(strOutput, vbTab, "\t")

    JsonSafe = strOutput
End Function

Private Function ParseJson(ByVal strJSON As String) As Object
    ' Simple JSON array parser - returns a Collection of Dictionary objects
    ' NOTE: This is a basic parser for Supabase REST API responses
    ' For complex JSON, consider using a full JSON library

    On Error GoTo ParseError

    Dim col As Object
    Set col = CreateObject("Scripting.Dictionary")

    ' Handle empty or null responses
    If Len(Trim(strJSON)) < 3 Then
        Set ParseJson = Nothing
        Exit Function
    End If

    ' Remove outer brackets if array
    strJSON = Trim(strJSON)
    If Left(strJSON, 1) = "[" Then strJSON = Mid(strJSON, 2)
    If Right(strJSON, 1) = "]" Then strJSON = Left(strJSON, Len(strJSON) - 1)

    ' Split into individual objects
    Dim arrObjects() As String
    Dim i As Long
    Dim dictItem As Object
    Dim strObj As String
    Dim arrPairs() As String
    Dim strPair As String
    Dim strKey As String
    Dim strValue As String
    Dim j As Long
    Dim itemCount As Long

    ' Handle empty array
    strJSON = Trim(strJSON)
    If Len(strJSON) = 0 Then
        Set ParseJson = col
        Exit Function
    End If

    ' Simple split by },{ for array of objects
    strJSON = Replace(strJSON, "},{", "}|{")
    arrObjects = Split(strJSON, "|")

    itemCount = 0
    For i = LBound(arrObjects) To UBound(arrObjects)
        strObj = arrObjects(i)
        strObj = Replace(strObj, "{", "")
        strObj = Replace(strObj, "}", "")

        Set dictItem = CreateObject("Scripting.Dictionary")

        ' Parse key-value pairs (simple parsing, assumes no nested objects)
        Dim inString As Boolean
        Dim currentKey As String
        Dim currentValue As String
        Dim parseState As Integer  ' 0=looking for key, 1=in key, 2=looking for value, 3=in value
        Dim c As String
        Dim pos As Long

        inString = False
        currentKey = ""
        currentValue = ""
        parseState = 0

        For pos = 1 To Len(strObj)
            c = Mid(strObj, pos, 1)

            Select Case parseState
                Case 0 ' Looking for key start
                    If c = """" Then
                        parseState = 1
                        currentKey = ""
                    End If
                Case 1 ' In key
                    If c = """" Then
                        parseState = 2
                    Else
                        currentKey = currentKey & c
                    End If
                Case 2 ' Looking for value
                    If c = ":" Then
                        parseState = 3
                        currentValue = ""
                        inString = False
                    End If
                Case 3 ' In value
                    If c = """" And Not inString Then
                        inString = True
                    ElseIf c = """" And inString Then
                        ' Check for escaped quote
                        If pos > 1 And Mid(strObj, pos - 1, 1) = "\" Then
                            currentValue = currentValue & c
                        Else
                            inString = False
                        End If
                    ElseIf c = "," And Not inString Then
                        ' End of this pair
                        currentValue = Trim(currentValue)
                        If Left(currentValue, 1) = """" Then currentValue = Mid(currentValue, 2)
                        If Right(currentValue, 1) = """" Then currentValue = Left(currentValue, Len(currentValue) - 1)
                        If currentValue = "null" Then currentValue = ""
                        If currentValue = "true" Then currentValue = True
                        If currentValue = "false" Then currentValue = False
                        dictItem(currentKey) = currentValue
                        parseState = 0
                    Else
                        currentValue = currentValue & c
                    End If
            End Select
        Next pos

        ' Don't forget the last pair
        If parseState = 3 And currentKey <> "" Then
            currentValue = Trim(currentValue)
            If Left(currentValue, 1) = """" Then currentValue = Mid(currentValue, 2)
            If Right(currentValue, 1) = """" Then currentValue = Left(currentValue, Len(currentValue) - 1)
            If currentValue = "null" Then currentValue = ""
            If currentValue = "true" Then currentValue = True
            If currentValue = "false" Then currentValue = False
            dictItem(currentKey) = currentValue
        End If

        itemCount = itemCount + 1
        col.Add CStr(itemCount), dictItem
    Next i

    Set ParseJson = col
    Exit Function

ParseError:
    Set ParseJson = Nothing
End Function

' ==========================================================================
' === CORE UPLOAD AND DELETE ROUTINES
' ==========================================================================

Public Sub myK9Q_Upload_v3(strCalledBy As String)
31210     On Error GoTo myK9Q_Upload_Error

          Dim iShowID As Long, iTrialID As Long, iClassID As Long

          ' Initial setup
31220     If strCalledBy = "Trial" Then
31230         iShowID = Forms!frm_Trial.txtShowID
31240         iTrialID = Forms!frm_Trial.txtTrialID
31250     ElseIf strCalledBy = "Class" Then
              ' UKC form field names: trialID (not txtTrialID), txtClassID
31260         iTrialID = Forms!frm_Class_Main.trialID
31270         iClassID = Forms!frm_Class_Main.txtClassID
              ' UKC: ShowID not on form, look it up from trial
31280         iShowID = Nz(DLookup("ShowID_FK", "tbl_Trial", "trialID = " & iTrialID), 0)
31290     End If

          ' License Check
          Dim strmyK9Q As String
31300     strmyK9Q = Nz(DLookup("MobileAppLicKeyStatus", "tbl_Show", "showID = " & iShowID), "")
31310     If InStr(1, strmyK9Q, "Active and Valid", vbTextCompare) = 0 Then
31320         MsgBox "Unable to Upload data without a Valid myK9Q License Key.", vbInformation, "myK9Q License Key"
31330         Exit Sub
31340     End If

          ' ==========================================================
          ' SCORED ENTRIES PROTECTION CHECK
          ' ==========================================================
          Dim strScoredList As String
          Dim intUserChoice As Integer
          Dim lngUnlocked As Long
          Dim blnOverwriteScores As Boolean
          blnOverwriteScores = False  ' Default: protect existing scores

          If strCalledBy = "Trial" Then
              ' TRIAL-LEVEL CHECK: Check ALL classes in the trial
              strScoredList = CheckScoredEntriesForTrial_v3(iShowID, iTrialID)

              If strScoredList <> "" Then
                  intUserChoice = ShowTrialScoredEntriesWarning(strScoredList)

                  Select Case intUserChoice
                      Case vbAbort   ' Cancel
                          MsgBox "Upload cancelled.", vbInformation, "Upload Cancelled"
                          Exit Sub

                      Case vbIgnore  ' Upload Anyway (scores protected)
                          ' Continue - database trigger will protect scores

                      Case vbRetry   ' Unlock & Overwrite
                          lngUnlocked = UnlockTrialForReupload_v3(iShowID, iTrialID)
                          blnOverwriteScores = True  ' Flag to reset scores in entry upload
                          MsgBox lngUnlocked & " entries unlocked for overwrite." & vbCrLf & _
                                 "Scores CAN now be overwritten.", vbExclamation, "Entries Unlocked"
                  End Select
              End If

          ElseIf strCalledBy = "Class" Then
              ' CLASS-LEVEL CHECK: Check just this class
              strScoredList = CheckScoredEntries_v3(iShowID, iClassID)

              If strScoredList <> "" Then
                  Dim strClassName As String
                  strClassName = Nz(DLookup("Element", "tbl_Class", "classID = " & iClassID), "") & " " & _
                                 Nz(DLookup("Level", "tbl_Class", "classID = " & iClassID), "")

                  intUserChoice = ShowScoredEntriesWarning(strScoredList, strClassName)

                  Select Case intUserChoice
                      Case vbAbort   ' Cancel
                          MsgBox "Upload cancelled.", vbInformation, "Upload Cancelled"
                          Exit Sub

                      Case vbIgnore  ' Upload Anyway (scores protected)
                          ' Continue - database trigger will protect scores

                      Case vbRetry   ' Unlock & Overwrite
                          lngUnlocked = UnlockClassForReupload_v3(iShowID, iClassID)
                          blnOverwriteScores = True  ' Flag to reset scores in entry upload
                          MsgBox lngUnlocked & " entries unlocked for overwrite." & vbCrLf & _
                                 "Scores CAN now be overwritten.", vbExclamation, "Entries Unlocked"
                  End Select
              End If
          End If
          ' ==========================================================
          ' END SCORED ENTRIES PROTECTION CHECK
          ' ==========================================================

31350     DoCmd.OpenForm "frm_Progress_myK9Q", acNormal

          ' UPLOAD SHOW
31360     Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Show ID: " & iShowID
31370     Forms!frm_Progress_myK9Q.Repaint
          Dim strNote As String
31380     strNote = Nz(DLookup("note", "tbl_show", "showID = " & iShowID), " ")
31390     strNote = Replace(strNote, "<div>", "")
31400     strNote = Replace(strNote, "</div>", "")
31410     Call SyncShowViaAPI_v3(iShowID, strNote)

          ' UPLOAD TRIALS
31420     Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Trial ID: " & iTrialID
31430     Forms!frm_Progress_myK9Q.Repaint
31440     Call SyncTrialsViaAPI_v3(iTrialID, iShowID)

          ' UPLOAD CLASSES
31450     If strCalledBy = "Class" Then
31460         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Class ID: " & iClassID
31470         Forms!frm_Progress_myK9Q.Repaint
31480         Call SyncClassesViaAPI_v3(iTrialID, iShowID, iClassID)
31490     Else
31500         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading all Classes for Trial ID: " & iTrialID
31510         Forms!frm_Progress_myK9Q.Repaint
31520         Call SyncClassesViaAPI_v3(iTrialID, iShowID)
31530     End If

          ' UPLOAD ENTRIES
31540     If strCalledBy = "Class" Then
31550         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Entries for Class ID: " & iClassID
31560         Forms!frm_Progress_myK9Q.Repaint
31570         Call SyncEntriesViaAPI_v3(iTrialID, iShowID, iClassID, blnOverwriteScores)
31580     Else
31590         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading all Entries for Trial ID: " & iTrialID
31600         Forms!frm_Progress_myK9Q.Repaint
31610         Call SyncEntriesViaAPI_v3(iTrialID, iShowID, 0, blnOverwriteScores)
31620     End If

31630     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
31640     MsgBox "myK9Q v3 Upload is Complete!", vbInformation, "Upload Complete"

myK9Q_Upload_Exit:
31650     Exit Sub
myK9Q_Upload_Error:
31660     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
31670     MsgBox "An unexpected error occurred in myK9Q_Upload_v3:" & vbCrLf & "Error #" & Err.Number & ": " & Err.Description, vbCritical
31680     Resume myK9Q_Upload_Exit
End Sub

Public Sub myK9QDelete_v3(strCalledBy As String)
31690     On Error GoTo Delete_Main_Error

          Dim strMobileAppLicKey As String, filterString As String
          Dim iClassID As Long, iTrialID As Long, iShowID As Long
          Dim strResult As VbMsgBoxResult

          Debug.Print "DELETE DEBUG 1: strCalledBy = " & strCalledBy
31700     If strCalledBy = "Show" Then
31710         iShowID = Forms!frm_Show.txtShowID
31720     ElseIf strCalledBy = "Trial" Then
31730         iShowID = Forms!frm_Trial.txtShowID
31740         iTrialID = Forms!frm_Trial.txtTrialID
31750     ElseIf strCalledBy = "Class" Then
              ' UKC form field names: trialID (not txtTrialID), txtClassID
31760         iTrialID = Forms!frm_Class_Main.trialID
31770         iClassID = Forms!frm_Class_Main.txtClassID
              ' UKC: ShowID not on form, look it up from trial
31780         iShowID = Nz(DLookup("ShowID_FK", "tbl_Trial", "trialID = " & iTrialID), 0)
31790     End If
          Debug.Print "DELETE DEBUG 2: iShowID=" & iShowID & " iTrialID=" & iTrialID & " iClassID=" & iClassID

31800     strMobileAppLicKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID), "")
          Debug.Print "DELETE DEBUG 3: strMobileAppLicKey = " & strMobileAppLicKey
31810     If strMobileAppLicKey = "" Then Exit Sub

31820     strResult = MsgBox("Are you sure you want to delete the corresponding data from the new Supabase database?", vbQuestion + vbYesNo, "Confirm Supabase Delete")
31830     If strResult = vbNo Then Exit Sub

          Debug.Print "DELETE DEBUG 4: About to open progress form"
31840     DoCmd.OpenForm "frm_Progress_myK9Q", acNormal
          Debug.Print "DELETE DEBUG 5: Progress form opened"

31850     If strCalledBy = "Show" Then
31860         filterString = "license_key=eq." & strMobileAppLicKey
              Debug.Print "DELETE DEBUG 6: Show filter = " & filterString
31870         Call DeleteFromSupabase_v3("shows", filterString)
31880     ElseIf strCalledBy = "Trial" Then
              Dim supaShowID As Long
31890         supaShowID = GetSupabaseShowID_v3(strMobileAppLicKey)
31900         If supaShowID > 0 Then
31910             filterString = "show_id=eq." & supaShowID & "&access_trial_id=eq." & iTrialID
                  Debug.Print "DELETE DEBUG 6: Trial filter = " & filterString
31920             Call DeleteFromSupabase_v3("trials", filterString)
31930         End If
31940     ElseIf strCalledBy = "Class" Then
31950         filterString = "access_show_id=eq." & iShowID & "&access_class_id=eq." & iClassID
              Debug.Print "DELETE DEBUG 6: Class filter = " & filterString
31960         Call DeleteFromSupabase_v3("classes", filterString)
31970     End If
          Debug.Print "DELETE DEBUG 7: Delete call completed"

31980     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
31990     MsgBox "Delete completed.", vbInformation

Delete_Main_Exit:
32000     Exit Sub
Delete_Main_Error:
32010     MsgBox "Error in myK9QDelete_v3: " & Err.Description & " (Line: " & Erl & ")", vbCritical
32020     Resume Delete_Main_Exit
End Sub


' ==========================================================================
' === SYNC (UPLOAD) SUB-ROUTINES
' ==========================================================================

Public Sub SyncShowViaAPI_v3(ByVal lngShowID As Long, ByVal strNote As String)
32900     On Error GoTo Error_Handler
          Dim db As DAO.Database, rs As DAO.Recordset, strSQL As String, qdf As DAO.QueryDef
          Const TABLE_NAME As String = "shows"
          Dim http As Object, json As String, recordsArray As String

32910     Set db = CurrentDb
32920     strSQL = "SELECT C.ClubName, C.Website AS ClubWebsite, S.MobileAppLicKey, S.startdate, S.enddate, S.showid, S.showname, S.eventurl, " & _
                    "P1.FullName AS Secretary, P1.Email AS SecretaryEmail, P1.phone AS SecretaryPhone, " & _
                    "P2.FullName AS Chairman, P2.Email AS ChairmanEmail, P2.phone AS ChairmanPhone, " & _
                    "S.SiteName, S.SiteAddress, S.SiteCity, ST.StateName, S.SiteZip " & _
                    "INTO temp_ForShowSync FROM ((((tbl_Show AS S LEFT JOIN tbl_Club AS C ON S.ClubID_FK = C.clubID) LEFT JOIN tbl_Person AS P1 ON S.SecretaryID_FK = P1.personID) LEFT JOIN tbl_Person AS P2 ON S.ChairmanID_FK = P2.personID) LEFT JOIN tbl_State AS ST ON S.SiteStateID_FK = ST.stateID) " & _
                    "WHERE S.showID = " & lngShowID
32930     DoCmd.SetWarnings False
32940     On Error Resume Next
32950     db.Execute "DROP TABLE temp_ForShowSync"
32960     db.QueryDefs.Delete "temp_MakeShowQuery"
32970     On Error GoTo Error_Handler
32980     Set qdf = db.CreateQueryDef("temp_MakeShowQuery", strSQL)
32990     DoCmd.OpenQuery "temp_MakeShowQuery"
33000     db.QueryDefs.Delete "temp_MakeShowQuery"
33010     Set qdf = Nothing
33020     DoCmd.SetWarnings True

33030     Set rs = db.OpenRecordset("temp_ForShowSync")
33040     If rs.RecordCount = 0 Then GoTo Exit_Sub

33050     recordsArray = "["
33060     rs.MoveFirst
          ' UKC CHANGE: Organization is "UKC Nosework" instead of "AKC Scent Work"
33070     json = "{" & _
               """license_key"":""" & JsonSafe(Nz(rs!MobileAppLicKey, "")) & """," & _
               """show_name"":""" & JsonSafe(Nz(rs!ShowName, "")) & """," & _
               """club_name"":""" & JsonSafe(Nz(rs!ClubName, "")) & """," & _
               """start_date"":""" & Format(Nz(rs!StartDate, Now), "yyyy-mm-dd") & """," & _
               """end_date"":""" & Format(Nz(rs!EndDate, Now), "yyyy-mm-dd") & """," & _
               """organization"":""UKC Nosework""," & _
               """show_type"":""Regular""," & _
               """site_name"":""" & JsonSafe(Nz(rs!SiteName, "")) & """," & _
               """site_address"":""" & JsonSafe(Nz(rs!SiteAddress, "")) & """," & _
               """site_city"":""" & JsonSafe(Nz(rs!SiteCity, "")) & """," & _
               """site_state"":""" & JsonSafe(Nz(rs!StateName, "")) & """," & _
               """site_zip"":""" & JsonSafe(Nz(rs!SiteZip, "")) & """," & _
               """secretary_name"":""" & JsonSafe(Nz(rs!Secretary, "")) & """," & _
               """secretary_email"":""" & JsonSafe(Nz(rs!SecretaryEmail, "")) & """," & _
               """secretary_phone"":""" & JsonSafe(Nz(rs!SecretaryPhone, "")) & """," & _
               """chairman_name"":""" & JsonSafe(Nz(rs!Chairman, "")) & """," & _
               """chairman_email"":""" & JsonSafe(Nz(rs!ChairmanEmail, "")) & """," & _
               """chairman_phone"":""" & JsonSafe(Nz(rs!ChairmanPhone, "")) & """," & _
               """event_url"":""" & JsonSafe(Nz(rs!eventurl, "")) & """," & _
               """website"":""" & JsonSafe(Nz(rs!ClubWebsite, "")) & """," & _
               """notes"":""" & JsonSafe(strNote) & """" & _
           "}"
33080     recordsArray = recordsArray & json & "]"
33090     rs.Close

33100     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
33110     http.Open "POST", SUPABASE_URL_2 & "/rest/v1/" & TABLE_NAME & "?on_conflict=license_key", False
33120     http.setRequestHeader "apikey", SUPABASE_KEY_2
33130     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
33140     http.setRequestHeader "Content-Type", "application/json"
33150     http.setRequestHeader "Prefer", "resolution=merge-duplicates"
33160     http.send recordsArray
33170     If http.Status < 200 Or http.Status >= 300 Then MsgBox "API Error (Show v2): " & http.Status & " - " & http.responseText, vbCritical
33180     Set http = Nothing
Exit_Sub:
33190     On Error Resume Next
33200     db.Execute "DROP TABLE temp_ForShowSync"
33210     db.QueryDefs.Delete "temp_MakeShowQuery"
33220     Set db = Nothing: Set rs = Nothing: Set http = Nothing: Set qdf = Nothing
33230     Exit Sub
Error_Handler:
33240     MsgBox "Error in SyncShowViaAPI_v3: " & Err.Description, vbCritical
33250     Resume Exit_Sub
End Sub

Private Sub SyncTrialsViaAPI_v3(ByVal lngTrialID As Long, ByVal lngShowID As Long)
33260     On Error GoTo Error_Handler
          Dim db As DAO.Database, rs As DAO.Recordset, strSQL As String
          Const TABLE_NAME As String = "trials"
          Dim http As Object, json As String, recordsArray As String
          Dim supaShowID As Long, strLicenseKey As String

33270     strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "ShowID = " & lngShowID), "")
          Debug.Print "TRIAL DEBUG 1: License key = " & strLicenseKey
33280     supaShowID = GetSupabaseShowID_v3(strLicenseKey)
          Debug.Print "TRIAL DEBUG 2: supaShowID = " & supaShowID
33290     If supaShowID = 0 Then
              Debug.Print "TRIAL DEBUG 2a: supaShowID is 0, exiting!"
              GoTo Exit_Sub
          End If

33300     Set db = CurrentDb
33310     strSQL = "SELECT T.TrialName, T.trial_long_date, T.TrialNumber, T.trialID, T.TrialType FROM tbl_Trial AS T WHERE T.trialID = " & lngTrialID
          Debug.Print "TRIAL DEBUG 3: SQL = " & strSQL
33320     Set rs = db.OpenRecordset(strSQL, dbOpenSnapshot)
          Debug.Print "TRIAL DEBUG 4: Recordset opened, EOF = " & rs.EOF
33330     If rs.EOF Then
              Debug.Print "TRIAL DEBUG 4a: No trial found, exiting!"
              GoTo Exit_Sub
          End If

33340     rs.MoveFirst
33350     recordsArray = "["
33360     json = "{" & _
                   """show_id"": " & supaShowID & "," & _
                   """trial_name"": """ & JsonSafe(Nz(rs!TrialName, "")) & """," & _
                   """trial_date"": """ & Format(GetDateFromString(rs!trial_long_date), "yyyy-mm-dd") & """," & _
                   """trial_number"": " & ExtractNumber(rs!TrialNumber) & "," & _
                   """trial_type"": """ & JsonSafe(Nz(rs!TrialType, "")) & """," & _
                   """access_trial_id"": " & Nz(rs!trialID, 0) & "" & _
               "}"
          Debug.Print "TRIAL DEBUG 5: JSON = " & json
33370     recordsArray = recordsArray & json & "]"
33380     rs.Close

33390     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
33400     http.Open "POST", SUPABASE_URL_2 & "/rest/v1/" & TABLE_NAME & "?on_conflict=show_id,trial_number,trial_date", False
33410     http.setRequestHeader "apikey", SUPABASE_KEY_2
33420     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
33430     http.setRequestHeader "Content-Type", "application/json"
33440     http.setRequestHeader "Prefer", "resolution=merge-duplicates"
33450     http.send recordsArray
          Debug.Print "TRIAL DEBUG 6: HTTP Status = " & http.Status & ", Response = " & Left(http.responseText, 500)
33460     If http.Status < 200 Or http.Status >= 300 Then MsgBox "API Error (Trial v2): " & http.Status & " - " & http.responseText, vbCritical
33470     Set http = Nothing
Exit_Sub:
33480     Set db = Nothing: Set rs = Nothing: Set http = Nothing
33490     Exit Sub
Error_Handler:
33500     MsgBox "Error in SyncTrialsViaAPI_v3: " & Err.Description, vbCritical
33510     Resume Exit_Sub
End Sub

Private Sub SyncClassesViaAPI_v3(ByVal lngTrialID As Long, ByVal lngShowID As Long, Optional ByVal lngClassID As Long = 0)
33520     On Error GoTo Error_Handler
          Dim db As DAO.Database, rs As DAO.Recordset, strSQL As String
          Const TABLE_NAME As String = "classes"
          Dim http As Object, json As String, recordsArray As String
          Dim supaTrialID As Long, strLicenseKey As String, filterClause As String

33530     strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & lngShowID), "")
          Debug.Print "CLASS DEBUG 1: License key = " & strLicenseKey
33540     supaTrialID = GetSupabaseTrialID_v3(strLicenseKey, lngTrialID)
          Debug.Print "CLASS DEBUG 2: supaTrialID = " & supaTrialID
33550     If supaTrialID = 0 Then
              Debug.Print "CLASS DEBUG 2a: supaTrialID is 0, exiting!"
              GoTo Exit_Sub
          End If

33560     If lngClassID > 0 Then filterClause = "C.classID = " & lngClassID Else filterClause = "C.TrialID_FK = " & lngTrialID
          Debug.Print "CLASS DEBUG 3: filterClause = " & filterClause

33570     Set db = CurrentDb
          ' UKC CHANGE: Use Division instead of Section, no TimeLimit2/TimeLimit3/Areas
33580     strSQL = "SELECT C.classID, C.Element, C.Level, C.Division, P.FullName AS JudgeName, " & _
                  "C.ClassOrder, C.TimeLimit " & _
                  "FROM tbl_Class AS C LEFT JOIN tbl_Person AS P ON C.JudgeID_FK = P.personID WHERE " & filterClause
33590     Set rs = db.OpenRecordset(strSQL, dbOpenSnapshot)
          Debug.Print "CLASS DEBUG 4: Recordset opened, EOF = " & rs.EOF
33600     If rs.EOF Then
              Debug.Print "CLASS DEBUG 4a: No classes found, exiting!"
              GoTo Exit_Sub
          End If

33610     recordsArray = "["
33620     Do While Not rs.EOF
              ' UKC CHANGE: Division maps to section, always 1 area, no area2/3 time limits
33630         json = "{" & _
                       """trial_id"": " & supaTrialID & "," & _
                       """element"": """ & JsonSafe(Nz(rs!Element, "")) & """," & _
                       """level"": """ & JsonSafe(Nz(rs![Level], "")) & """," & _
                       """section"": """ & JsonSafe(Nz(rs!Division, "")) & """," & _
                       """judge_name"": """ & JsonSafe(Nz(rs!JudgeName, "")) & """," & _
                       """class_order"": " & Nz(rs!ClassOrder, 0) & "," & _
                       """time_limit_seconds"": " & TimeToJsonValue(rs!TimeLimit) & "," & _
                       """time_limit_area2_seconds"": null," & _
                       """time_limit_area3_seconds"": null," & _
                       """area_count"": 1," & _
                       """access_class_id"": " & Nz(rs!classID, 0) & "," & _
                       """access_trial_id"": " & lngTrialID & "," & _
                       """access_show_id"": " & lngShowID & "" & _
                   "}"
33640         recordsArray = recordsArray & json & ","
33650         rs.MoveNext
33660     Loop
33670     rs.Close

33680     If Len(recordsArray) > 1 Then recordsArray = Left(recordsArray, Len(recordsArray) - 1) & "]" Else GoTo Exit_Sub
          Debug.Print "CLASS DEBUG 5: JSON to send (first 500 chars) = " & Left(recordsArray, 500)

33690     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
33700     http.Open "POST", SUPABASE_URL_2 & "/rest/v1/" & TABLE_NAME & "?on_conflict=trial_id,element,level,section", False
33710     http.setRequestHeader "apikey", SUPABASE_KEY_2
33720     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
33730     http.setRequestHeader "Content-Type", "application/json"
33740     http.setRequestHeader "Prefer", "resolution=merge-duplicates"
33750     http.send recordsArray
          Debug.Print "CLASS DEBUG 6: HTTP Status = " & http.Status
          Debug.Print "CLASS DEBUG 6a: Response = " & Left(http.responseText, 300)
33760     If http.Status < 200 Or http.Status >= 300 Then MsgBox "API Error (Class v2): " & http.Status & " - " & http.responseText, vbCritical
33770     Set http = Nothing
Exit_Sub:
33780     Set db = Nothing: Set rs = Nothing: Set http = Nothing
33790     Exit Sub
Error_Handler:
33800     MsgBox "Error in SyncClassesViaAPI_v3: " & Err.Description, vbCritical
33810     Resume Exit_Sub
End Sub

Private Sub SyncEntriesViaAPI_v3(ByVal lngTrialID As Long, ByVal lngShowID As Long, Optional ByVal lngClassID As Long = 0, Optional ByVal blnResetScores As Boolean = False)
33820     On Error GoTo Error_Handler
          Dim db As DAO.Database, rs As DAO.Recordset, strSQL As String
          Const TABLE_NAME As String = "entries"
          Dim http As Object, json As String, recordsArray As String, filterClause As String
          Dim classIdMap As Scripting.Dictionary
          Dim uniqueClassIDs As String
          Dim strTempClassKey As String
          Dim supaClassID As Long
          Dim strClassKey As String
33830     Set classIdMap = New Scripting.Dictionary
          Debug.Print "DEBUG 1: Dictionary created"
          MsgBox "DEBUG: Starting SyncEntriesViaAPI_v3 - Check Immediate window (Ctrl+G) for details", vbInformation

          ' NOTE: Scored entries check is now handled in the main upload routine
          ' (UploadToMyK9Q_v3) BEFORE calling this function. Do not duplicate here.

33840     If lngClassID > 0 Then filterClause = "E.classID_FK = " & lngClassID Else filterClause = "E.TrialID_FK = " & lngTrialID
          Debug.Print "DEBUG 2: Filter clause = " & filterClause

33850     Set db = CurrentDb
          Debug.Print "DEBUG 3: Database set"
          ' UKC CHANGE: Use SearchTime + ElementTime instead of AreaTime1/2/3
          ' SearchTime = pausable search time (used for placements)
          ' ElementTime = total elapsed time (continuous timer against time limit)
          ' UKC field names: ExhibitorRunOrder (not ExhibitorOrder), Disqualified (not Withdrawn), DQReason (not WithdrawnReason)
          ' UKC doesn't have: CorrectCount, IncorrectCount, TotalScore, entry_status
33860     strSQL = "SELECT E.entryID, E.classID_FK, E.Armband, P.FullName AS HandlerName, D.CallName, B.BreedName, E.ExhibitorRunOrder, " & _
                  "E.Qualified, E.NQ, E.Excused, E.Absent, E.Disqualified, " & _
                  "E.NQReason, E.ExcusedReason, E.DQReason, " & _
                  "E.SearchTime, E.ElementTime, " & _
                  "E.FaultHE, E.FaultSC, " & _
                  "E.PlacementSort " & _
                  "FROM (((tbl_Entry AS E LEFT JOIN tbl_Person AS P ON E.HandlerID_FK = P.personID) " & _
                  "LEFT JOIN tbl_Exhibitor AS D ON E.exhibitorID_FK = D.exhibitorID) " & _
                  "LEFT JOIN tbl_Breed AS B ON D.BreedID_FK = B.breedID) " & _
                  "WHERE " & filterClause
          Debug.Print "DEBUG 4: About to open recordset"
          Debug.Print "DEBUG 4a: SQL = " & strSQL
33870     Set rs = db.OpenRecordset(strSQL, dbOpenSnapshot)
          Debug.Print "DEBUG 5: Recordset opened, EOF = " & rs.EOF
33880     If rs.EOF Then GoTo Exit_Sub

33890     rs.MoveFirst
          Debug.Print "DEBUG 6: MoveFirst done, starting class ID collection"
33900     Do While Not rs.EOF
              strTempClassKey = CStr(Nz(rs!ClassID_FK, 0))
33910         If strTempClassKey <> "0" And Not classIdMap.Exists(strTempClassKey) Then
33920             classIdMap.Add strTempClassKey, 0
33930             uniqueClassIDs = uniqueClassIDs & strTempClassKey & ","
33940         End If
33950         rs.MoveNext
33960     Loop

33970     If uniqueClassIDs = "" Then GoTo Exit_Sub
33980     uniqueClassIDs = Left(uniqueClassIDs, Len(uniqueClassIDs) - 1)
          Debug.Print "DEBUG 7: Unique class IDs = " & uniqueClassIDs

33990     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
          Debug.Print "DEBUG 8: HTTP object created"
          Dim fullUrl As String
34000     fullUrl = SUPABASE_URL_2 & "/rest/v1/classes?select=id,access_class_id&access_show_id=eq." & lngShowID & "&access_class_id=in.(" & uniqueClassIDs & ")"
34010     http.Open "GET", fullUrl, False
34020     http.setRequestHeader "apikey", SUPABASE_KEY_2
34030     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
34040     http.send
          Debug.Print "DEBUG 9: HTTP sent, Status = " & http.Status
          Debug.Print "DEBUG 9a: Response = " & Left(http.responseText, 200)

34050     If http.Status = 200 Then
              ' VBA-JSON has issues with multi-line array responses from Supabase
              ' Use simple string parsing instead
              Dim responseText As String
              responseText = http.responseText
              Debug.Print "DEBUG 10: Parsing class mappings from response"

              ' Extract all {"id":XXX,"access_class_id":YYY} pairs
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

                  Debug.Print "DEBUG 11: Mapping access_class_id=" & accessIdVal & " to id=" & idVal
                  classIdMap(accessIdVal) = CLng(Val(idVal))
                  pos = endPos
              Loop
              Debug.Print "DEBUG 11a: Total mappings = " & classIdMap.count
34120     Else
34130         GoTo Exit_Sub
34140     End If
34150     Set http = Nothing
          Debug.Print "DEBUG 12: HTTP object released, classIdMap.count = " & classIdMap.count

34160     recordsArray = "["
34170     rs.MoveFirst
          Debug.Print "DEBUG 13: Starting entries loop"
34180     Do While Not rs.EOF
              strClassKey = CStr(Nz(rs!ClassID_FK, 0))
              If classIdMap.Exists(strClassKey) Then
34190             supaClassID = classIdMap(strClassKey)
              Else
                  supaClassID = 0
              End If
34200         If supaClassID > 0 Then
34210             json = "{" & _
                           """class_id"": " & supaClassID & "," & _
                           """armband_number"": " & Nz(rs!Armband, 0) & "," & _
                           """handler_name"": """ & JsonSafe(Nz(rs!HandlerName, "N/A")) & """," & _
                           """dog_call_name"": """ & JsonSafe(Nz(rs!CallName, "N/A")) & """," & _
                           """dog_breed"": """ & JsonSafe(Nz(rs!BreedName, "N/A")) & """," & _
                           """exhibitor_order"": " & Nz(rs!ExhibitorRunOrder, 0) & "," & _
                           """entry_status"": ""no-status""," & _
                           """access_entry_id"": " & Nz(rs!entryID, 0) & "," & _
                           """access_class_id"": " & Nz(rs!ClassID_FK, 0) & "," & _
                           """access_trial_id"": " & lngTrialID & "," & _
                           """access_show_id"": " & lngShowID

              ' If overwriting scores (user chose Overwrite), include ACTUAL Access scoring data
              If blnResetScores Then
                  Dim strResultStatus As String
                  Dim strReason As String
                  Dim lngTotalFaults As Long
                  Dim blnIsScored As Boolean

                  ' Determine result_status from Access Yes/No fields
                  If Nz(rs!Qualified, False) = True Then
                      strResultStatus = "qualified"
                      blnIsScored = True
                  ElseIf Nz(rs!NQ, False) = True Then
                      strResultStatus = "nq"
                      strReason = Nz(rs!NQReason, "")
                      blnIsScored = True
                  ElseIf Nz(rs!Excused, False) = True Then
                      strResultStatus = "excused"
                      strReason = Nz(rs!ExcusedReason, "")
                      blnIsScored = True
                  ElseIf Nz(rs!Absent, False) = True Then
                      strResultStatus = "absent"
                      blnIsScored = True
                  ElseIf Nz(rs!Disqualified, False) = True Then
                      strResultStatus = "disqualified"
                      strReason = Nz(rs!DQReason, "")
                      blnIsScored = True
                  Else
                      strResultStatus = "pending"
                      blnIsScored = False
                  End If

                  ' Sum fault fields (UKC uses FaultHE and FaultSC)
                  lngTotalFaults = Nz(rs!FaultHE, 0) + Nz(rs!FaultSC, 0)

                  ' UKC CHANGE: Use search_time_seconds and element_time_seconds
                  ' instead of area1/2/3_time_seconds
                  json = json & "," & _
                            """is_scored"": " & LCase(CStr(blnIsScored)) & "," & _
                            """result_status"": """ & strResultStatus & """," & _
                            """search_time_seconds"": " & ConvertTimeToSeconds(Nz(rs!SearchTime, "")) & "," & _
                            """element_time_seconds"": " & ConvertTimeToSeconds(Nz(rs!ElementTime, "")) & "," & _
                            """area1_time_seconds"": 0," & _
                            """area2_time_seconds"": 0," & _
                            """area3_time_seconds"": 0," & _
                            """total_faults"": " & lngTotalFaults & "," & _
                            """total_correct_finds"": 0," & _
                            """total_incorrect_finds"": 0," & _
                            """final_placement"": " & Nz(rs!PlacementSort, 0) & "," & _
                            """total_score"": 0," & _
                            """points_earned"": 0," & _
                            """scoring_completed_at"": null"

                  ' Add disqualification reason
                  If strReason <> "" Then
                      json = json & "," & """disqualification_reason"": """ & JsonSafe(strReason) & """"
                  Else
                      json = json & "," & """disqualification_reason"": null"
                  End If
              End If

              json = json & "}"
34220             recordsArray = recordsArray & json & ","
34230         End If
34240         rs.MoveNext
34250     Loop
34260     rs.Close

34270     If Len(recordsArray) <= 1 Then GoTo Exit_Sub
34280     recordsArray = Left(recordsArray, Len(recordsArray) - 1) & "]"

34290     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
34300     http.Open "POST", SUPABASE_URL_2 & "/rest/v1/" & TABLE_NAME & "?on_conflict=class_id,armband_number", False
34310     http.setRequestHeader "apikey", SUPABASE_KEY_2
34320     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
34330     http.setRequestHeader "Content-Type", "application/json"
34340     http.setRequestHeader "Prefer", "resolution=merge-duplicates"
34350     http.send recordsArray
34360     If http.Status < 200 Or http.Status >= 300 Then MsgBox "API Error (Entry v2): " & http.Status & " - " & http.responseText, vbCritical
Exit_Sub:
34370     On Error Resume Next
34380     Set db = Nothing: Set rs = Nothing: Set http = Nothing
34390     Set classIdMap = Nothing
34400     Exit Sub
Error_Handler:
34410     MsgBox "Error in SyncEntriesViaAPI_v3: " & Err.Description, vbCritical
34420     Resume Exit_Sub
End Sub
' ==========================================================================
' === HELPER FUNCTIONS
' ==========================================================================

Private Sub DeleteFromSupabase_v3(ByVal TableName As String, ByVal filter As String)
34430     On Error GoTo Delete_Error
          Dim http As Object, fullUrl As String
34440     If SUPABASE_URL_2 = "https_YOUR_SECOND_URL.supabase.co" Or SUPABASE_KEY_2 = "your_second_supabase_key_here" Then Exit Sub
34450     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
34460     fullUrl = SUPABASE_URL_2 & "/rest/v1/" & TableName & "?" & filter
34470     http.Open "DELETE", fullUrl, False
34480     http.setRequestHeader "apikey", SUPABASE_KEY_2
34490     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
34500     http.send
34510     If http.Status <> 204 And http.Status <> 404 Then MsgBox "API DELETE Error on table '" & TableName & "':" & vbCrLf & http.Status & " - " & http.statusText & vbCrLf & http.responseText, vbCritical
34520     Set http = Nothing
34530     Exit Sub
Delete_Error:
34540     MsgBox "An error occurred in DeleteFromSupabase_v3:" & vbCrLf & Err.Description, vbCritical
34550     Set http = Nothing
End Sub

Private Function GetSupabaseShowID_v3(ByVal licenseKey As String) As Long
34560     On Error GoTo GetID_Error
          Dim http As Object, jsonResponse As String, parsedJson As Object
34570     GetSupabaseShowID_v3 = 0
          Debug.Print "SHOWID DEBUG 1: licenseKey = " & licenseKey
34580     If IsNull(licenseKey) Or licenseKey = "" Then
              Debug.Print "SHOWID DEBUG 1a: licenseKey is null/empty, exiting"
              Exit Function
          End If
34590     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
          Dim fullUrl As String
34600     fullUrl = SUPABASE_URL_2 & "/rest/v1/shows?select=id&license_key=eq." & licenseKey
          Debug.Print "SHOWID DEBUG 2: URL = " & fullUrl
34610     http.Open "GET", fullUrl, False
34620     http.setRequestHeader "apikey", SUPABASE_KEY_2
34630     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
34640     http.send
          Debug.Print "SHOWID DEBUG 3: HTTP Status = " & http.Status
34650     If http.Status = 200 Then
34660         jsonResponse = http.responseText
              Debug.Print "SHOWID DEBUG 4: Response = " & jsonResponse
34670         Set parsedJson = ParseJson(jsonResponse)
              Debug.Print "SHOWID DEBUG 5: parsedJson Is Nothing = " & (parsedJson Is Nothing)
              ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
34680         If Not parsedJson Is Nothing Then
                  Debug.Print "SHOWID DEBUG 6: parsedJson.count = " & parsedJson.count
                  If parsedJson.count > 0 Then
                      Debug.Print "SHOWID DEBUG 6a: TypeName(parsedJson) = " & TypeName(parsedJson)
                      ' Explore dictionary keys
                      Dim k As Variant
                      For Each k In parsedJson.Keys
                          Debug.Print "SHOWID DEBUG 6b: Key=" & k & " TypeName=" & TypeName(parsedJson(k))
                      Next k
                      ' Try to get the first item (could be indexed 0, 1, or "id")
                      Dim firstKey As Variant
                      firstKey = parsedJson.Keys()(0)
                      Debug.Print "SHOWID DEBUG 6c: firstKey = " & firstKey
                      Dim firstItem As Object
                      Set firstItem = parsedJson(firstKey)
                      Debug.Print "SHOWID DEBUG 6d: firstItem(""id"") = " & firstItem("id")
                      GetSupabaseShowID_v3 = CLng(Val(firstItem("id")))
                  End If
              End If
34690     End If
          Debug.Print "SHOWID DEBUG 7: Returning " & GetSupabaseShowID_v3
GetID_Exit:
34700     Set http = Nothing: Set parsedJson = Nothing
34710     Exit Function
GetID_Error:
          Debug.Print "SHOWID DEBUG ERROR: " & Err.Number & " - " & Err.Description
34720     Resume GetID_Exit
End Function

Private Function GetSupabaseTrialID_v3(ByVal licenseKey As String, ByVal accessTrialID As Long) As Long
34730     On Error GoTo GetID_Error
          Dim http As Object, jsonResponse As String, parsedJson As Object, supaShowID As Long
34740     GetSupabaseTrialID_v3 = 0
34750     If accessTrialID = 0 Or licenseKey = "" Then Exit Function
34760     supaShowID = GetSupabaseShowID_v3(licenseKey)
34770     If supaShowID = 0 Then Exit Function
34780     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
          Dim fullUrl As String
34790     fullUrl = SUPABASE_URL_2 & "/rest/v1/trials?select=id&show_id=eq." & supaShowID & "&access_trial_id=eq." & accessTrialID
34800     http.Open "GET", fullUrl, False
34810     http.setRequestHeader "apikey", SUPABASE_KEY_2
34820     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
34830     http.send
34840     If http.Status = 200 Then
34850         jsonResponse = http.responseText
34860         Set parsedJson = ParseJson(jsonResponse)
              ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
34870         If Not parsedJson Is Nothing Then
                  If parsedJson.count > 0 Then
                      ' VBA-JSON uses Dictionary with numeric keys for arrays
                      Dim firstKey As Variant
                      firstKey = parsedJson.Keys()(0)
                      Dim firstItem As Object
                      Set firstItem = parsedJson(firstKey)
                      GetSupabaseTrialID_v3 = CLng(Val(firstItem("id")))
                  End If
              End If
34880     End If
GetID_Exit:
34890     Set http = Nothing: Set parsedJson = Nothing
34900     Exit Function
GetID_Error:
34910     Resume GetID_Exit
End Function

Private Function GetSupabaseClassID_v3(ByVal licenseKey As String, ByVal accessClassID As Long) As Long
34920     On Error GoTo GetID_Error
          Dim http As Object, jsonResponse As String, parsedJson As Object, accessShowID As Long
34930     GetSupabaseClassID_v3 = 0
34940     If accessClassID = 0 Or licenseKey = "" Then Exit Function
34950     On Error Resume Next
34960     accessShowID = DLookup("ShowID", "tbl_Show", "MobileAppLicKey = '" & licenseKey & "'")
34970     On Error GoTo GetID_Error
34980     If accessShowID = 0 Then Exit Function
34990     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
          Dim fullUrl As String
35000     fullUrl = SUPABASE_URL_2 & "/rest/v1/classes?select=id&access_show_id=eq." & accessShowID & "&access_class_id=eq." & accessClassID
35010     http.Open "GET", fullUrl, False
35020     http.setRequestHeader "apikey", SUPABASE_KEY_2
35030     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
35040     http.send
35050     If http.Status = 200 Then
35060         jsonResponse = http.responseText
35070         Set parsedJson = ParseJson(jsonResponse)
              ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
35080         If Not parsedJson Is Nothing Then
                  If parsedJson.count > 0 Then
                      ' VBA-JSON uses Dictionary with numeric keys for arrays
                      Dim firstKey2 As Variant
                      firstKey2 = parsedJson.Keys()(0)
                      Dim firstItem2 As Object
                      Set firstItem2 = parsedJson(firstKey2)
                      GetSupabaseClassID_v3 = CLng(Val(firstItem2("id")))
                  End If
              End If
35090     End If
GetID_Exit:
35110     Set http = Nothing: Set parsedJson = Nothing
35120     Exit Function
GetID_Error:
35130     MsgBox "Error in GetSupabaseClassID_v3: " & Err.Description, vbCritical
35140     Resume GetID_Exit
End Function

' --- UTILITY FUNCTIONS ---

Private Function ExtractNumber(ByVal inputText As Variant) As Long
35150     On Error Resume Next
          Dim cleanText As String, i As Integer, result As String
35160     cleanText = Nz(inputText, "0")
35170     result = ""
35180     For i = 1 To Len(cleanText)
35190         If IsNumeric(Mid(cleanText, i, 1)) Then result = result & Mid(cleanText, i, 1)
35200     Next i
35210     ExtractNumber = CLng(Nz(result, "0"))
35220     If Err.Number <> 0 Then ExtractNumber = 0: Err.Clear
End Function

Private Function GetDateFromString(ByVal dateText As Variant) As Date
35230     On Error GoTo DateError
          Dim cleanText As String
35240     cleanText = Nz(dateText, "")
35250     If InStr(cleanText, ",") > 0 Then cleanText = Trim(Mid(cleanText, InStr(cleanText, ",") + 1))
35260     If IsDate(cleanText) Then GetDateFromString = CDate(cleanText) Else GetDateFromString = Date
35270     Exit Function
DateError:
35280     GetDateFromString = Date
End Function

Private Function ParseTimeToSeconds_v3(ByVal timeValue As Variant) As Long
35290     On Error Resume Next
35300     If IsNull(timeValue) Or timeValue = "" Then ParseTimeToSeconds_v3 = 0: Exit Function
          Dim cleanString As String
35310     cleanString = CStr(timeValue)
35320     cleanString = Replace(cleanString, ":", "")
35330     cleanString = Right("0000" & cleanString, 4)
          Dim minutes As Long, seconds As Long
35340     minutes = CLng(Left(cleanString, 2))
35350     seconds = CLng(Right(cleanString, 2))
35360     ParseTimeToSeconds_v3 = (minutes * 60) + seconds
35370     If Err.Number <> 0 Then ParseTimeToSeconds_v3 = 0: Err.Clear
End Function

Private Function ConvertSecondsToTimeFormat(ByVal totalSeconds As Variant) As String
35380     On Error GoTo FormatError

          Dim dblSeconds As Double
35390     dblSeconds = CDbl(Nz(totalSeconds, 0))

35400     If dblSeconds <= 0 Then
35410         ConvertSecondsToTimeFormat = "00:00.00"
35420         Exit Function
35430     End If

          Dim minutes As Long
          Dim seconds As Long
          Dim hundredths As Long

35440     minutes = Int(dblSeconds) \ 60
35450     seconds = Int(dblSeconds) Mod 60
35460     hundredths = Round((dblSeconds - Int(dblSeconds)) * 100, 0)

35470     ConvertSecondsToTimeFormat = Format(minutes, "00") & ":" & Format(seconds, "00") & "." & Format(hundredths, "00")
35480     Exit Function

FormatError:
35490     ConvertSecondsToTimeFormat = "00:00.00"
End Function

Private Function GetJsonValue(jsonString As String, key As String) As String
35500     On Error Resume Next
          Dim keyStr As String, startPos As Long, endPos As Long, valStart As Long
35510     keyStr = """" & key & """:"
35520     startPos = InStr(1, jsonString, keyStr, vbTextCompare)

35530     If startPos > 0 Then
35540         valStart = startPos + Len(keyStr)

35550         If Mid(jsonString, valStart, 1) = """" Then
35560             endPos = InStr(valStart + 1, jsonString, """")
35570             GetJsonValue = Mid(jsonString, valStart + 1, endPos - valStart - 1)
35580         Else
35590             endPos = InStr(valStart, jsonString, ",")
35600             If endPos = 0 Then endPos = InStr(valStart, jsonString, "}")
35610             GetJsonValue = Trim(Mid(jsonString, valStart, endPos - valStart))
35620         End If
35630     Else
35640         GetJsonValue = ""
35650     End If
End Function

Public Sub myK9Q_Class_Result_Download_v3()
32030     On Error GoTo Download_Error

          Dim iClassID As Long, iShowID As Long
          Dim db As DAO.Database, http As Object
          Dim jsonResponse As String, classJsonResponse As String
          Dim parsedJson As Object, dataItem As Object, parsedClassJson As Object
          Dim strSQL As String
          Dim updatedCount As Long
          Dim classTimeLimitSeconds As Double
          Dim rsClass As DAO.Recordset

32050     Set db = CurrentDb
          ' UKC form field names: trialID (not txtTrialID), txtClassID
32060     iClassID = Forms!frm_Class_Main.txtClassID
32070     iShowID = DLookup("ShowID_FK", "tbl_Trial", "TrialID = " & Forms!frm_Class_Main.trialID)

          ' ==========================================================
          ' SCORED ENTRIES PROTECTION CHECK (Protect Access scores)
          ' ==========================================================
          Dim strScoredListAccess As String
          Dim intUserChoice As Integer
          Dim blnOverwriteAccessScores As Boolean
          Dim strClassName As String
          blnOverwriteAccessScores = False

          strScoredListAccess = CheckScoredEntriesInAccess_v3(iClassID)

          If strScoredListAccess <> "" Then
              strClassName = Nz(DLookup("Element", "tbl_Class", "classID = " & iClassID), "") & " " & _
                             Nz(DLookup("Level", "tbl_Class", "classID = " & iClassID), "")

              intUserChoice = ShowAccessScoredEntriesWarning(strScoredListAccess, strClassName)

              Select Case intUserChoice
                  Case vbAbort
                      MsgBox "Download cancelled.", vbInformation, "Download Cancelled"
                      Exit Sub

                  Case vbIgnore
                      MsgBox "Download cancelled. Access scores preserved.", vbInformation, "Scores Protected"
                      Exit Sub

                  Case vbRetry
                      blnOverwriteAccessScores = True
              End Select
          End If
          ' ==========================================================
          ' END SCORED ENTRIES PROTECTION CHECK
          ' ==========================================================

32080     DoCmd.OpenForm "frm_Progress_myK9Q", acNormal
32090     Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Downloading results for Class ID: " & iClassID
32100     Forms!frm_Progress_myK9Q.Repaint

32110     Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")

          ' --- Get the Class Time Limit First ---
          ' UKC CHANGE: Only one time limit (no area2/area3)
32120     http.Open "GET", SUPABASE_URL_2 & "/rest/v1/classes?select=time_limit_seconds&access_class_id=eq." & iClassID, False
32130     http.setRequestHeader "apikey", SUPABASE_KEY_2
32140     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
32150     http.send
32160     If http.Status = 200 Then
32170         Set parsedClassJson = ParseJson(http.responseText)
              ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
32180         If Not parsedClassJson Is Nothing Then
              If parsedClassJson.count > 0 Then
32190             classTimeLimitSeconds = CDbl(Nz(parsedClassJson(1)("time_limit_seconds"), 0))

                  On Error Resume Next
                  Set rsClass = db.OpenRecordset("SELECT * FROM tbl_Class WHERE classID = " & iClassID, dbOpenDynaset)

                  If Not rsClass.EOF Then
                      rsClass.Edit
                      Dim lngSeconds As Long
                      If classTimeLimitSeconds > 0 Then
                          lngSeconds = CLng(classTimeLimitSeconds)
                          rsClass!TimeLimit = Format(lngSeconds \ 60, "00") & ":" & Format(lngSeconds Mod 60, "00")
                      Else
                          rsClass!TimeLimit = Null
                      End If
                      rsClass.Update
                      Debug.Print "Time limit synced to Access - TL: " & classTimeLimitSeconds & "s"
                  End If

                  rsClass.Close
                  Set rsClass = Nothing
                  On Error GoTo Download_Error

              End If  ' parsedClassJson.count > 0
32200         End If  ' parsedClassJson Is Nothing
32210     End If  ' http.Status = 200

          ' --- Get all ENTRIES with their result data ---
          ' UKC CHANGE: Include element_time_seconds instead of area2/area3 times
32220     http.Open "GET", SUPABASE_URL_2 & "/rest/v1/entries?select=access_entry_id,result_status,disqualification_reason,search_time_seconds,element_time_seconds,total_faults,total_correct_finds,total_incorrect_finds,no_finish_count,is_scored,final_placement&access_class_id=eq." & iClassID, False
32230     http.setRequestHeader "apikey", SUPABASE_KEY_2
32240     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
32250     http.send

32260     If http.Status <> 200 Then GoTo Download_Exit

32440     DoCmd.SetWarnings False
32430     jsonResponse = http.responseText
32450     If Len(Nz(jsonResponse, "")) < 5 Then GoTo FinalizeDownload

32460     Set parsedJson = ParseJson(jsonResponse)
          ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
32470     If Not parsedJson Is Nothing Then
          If parsedJson.count > 0 Then
32480         For Each dataItem In parsedJson
                  Dim accessEntryID As Long
32490             accessEntryID = CLng(Nz(dataItem("access_entry_id"), 0))

32530             If accessEntryID > 0 Then
                      If Nz(dataItem("is_scored"), False) = True Then
                          Dim blnScoredInAccess As Boolean
                          blnScoredInAccess = IsEntryScoredInAccess(accessEntryID)

                          If blnScoredInAccess And Not blnOverwriteAccessScores Then
                              GoTo NextEntry
                          End If

                          ' UKC CHANGE: Map search_time_seconds and element_time_seconds
32540                     strSQL = "UPDATE tbl_Entry SET " & _
                                   "NQReason = '" & JsonSafe(Nz(dataItem("disqualification_reason"), "None")) & "', " & _
                                   "SearchTime = '" & ConvertSecondsToTimeFormat(dataItem("search_time_seconds")) & "', " & _
                                   "ElementTime = '" & ConvertSecondsToTimeFormat(dataItem("element_time_seconds")) & "', " & _
                                   "FaultHE = " & Nz(dataItem("total_faults"), 0) & ", " & _
                                   "result_text = '" & JsonSafe(Nz(dataItem("result_status"), "None")) & "' " & _
                               "WHERE entryID = " & accessEntryID
32550                     db.Execute strSQL, dbFailOnError

                          Dim SearchTime As Double
                          Dim ElementTime As Double
32560                     SearchTime = CDbl(Nz(dataItem("search_time_seconds"), 0))
                          ElementTime = CDbl(Nz(dataItem("element_time_seconds"), 0))

32570                     Select Case LCase(Nz(dataItem("result_status"), "pending"))
                              Case "qualified"
                                  ' UKC: Use SearchTime for Millisecs1 (placement time)
32580                             strSQL = "UPDATE tbl_Entry SET Qualified = True, NQ = False, Absent = False, Excused = False, Disqualified = False, Millisecs1 = " & CLng(SearchTime * 1000) & ", Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32590                         Case "nq"
32600                             strSQL = "UPDATE tbl_Entry SET NQ = True, Qualified = False, Absent = False, Excused = False, Disqualified = False, Millisecs1 = 0, Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32610                         Case "absent"
32620                             strSQL = "UPDATE tbl_Entry SET Absent = True, Qualified = False, NQ = False, Excused = False, Disqualified = False, Millisecs1 = 0, Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32630                         Case "excused"
32640                             strSQL = "UPDATE tbl_Entry SET Excused = True, ExcusedReason = '" & JsonSafe(Nz(dataItem("disqualification_reason"), "")) & "', Qualified = False, NQ = False, Absent = False, Disqualified = False, Millisecs1 = 0, Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32650                         Case "disqualified"
32660                             strSQL = "UPDATE tbl_Entry SET Disqualified = True, Qualified = False, NQ = False, Absent = False, Excused = False, Millisecs1 = 0, Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32670                         Case Else
32680                             strSQL = "UPDATE tbl_Entry SET Qualified = False, NQ = False, Absent = False, Excused = False, Disqualified = False, Millisecs1 = 0, Millisecs2 = 0, Millisecs3 = 0 WHERE entryID = " & accessEntryID
32690                     End Select
32700                     db.Execute strSQL, dbFailOnError

32710                     updatedCount = updatedCount + 1
                      End If
32720             End If
NextEntry:
32730         Next dataItem
          End If  ' parsedJson.count > 0
32740     End If  ' parsedJson Is Nothing

FinalizeDownload:
          ' NOTE: UKC does not use CalculateScores or Class_Placements
          ' (UKC scoring is simpler than AKC)

32770     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
32780     Forms!frm_Class_Main.Requery
32790     MsgBox "Download complete. " & updatedCount & " entries were updated.", vbInformation, "Download Complete"

Download_Exit:
32800     On Error Resume Next
32810     DoCmd.SetWarnings True
32820     Set db = Nothing: Set http = Nothing: Set parsedJson = Nothing
32830     Set dataItem = Nothing: Set parsedClassJson = Nothing
          Set rsClass = Nothing
32840     Exit Sub

Download_Error:
32850     On Error Resume Next
32860     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
32870     On Error GoTo 0
32880     MsgBox "An error occurred during download:" & vbCrLf & vbCrLf & _
                  "Error Number: " & Err.Number & vbCrLf & _
                  "Description: " & Err.Description, vbCritical, "Download Failed"
32890     Resume Download_Exit
End Sub

Private Function TimeToJsonValue(ByVal timeValue As Variant) As String
    On Error Resume Next

    If IsNull(timeValue) Or Nz(timeValue, "") = "" Then
        TimeToJsonValue = "null"
        Exit Function
    End If

    Dim seconds As Long
    seconds = ParseTimeToSeconds_v3(timeValue)

    If seconds = 0 Then
        TimeToJsonValue = "null"
    Else
        TimeToJsonValue = CStr(seconds)
    End If
End Function

Private Function AreaCountToJsonValue(ByVal areaCount As Variant) As String
    On Error Resume Next

    Dim count As Long
    count = Nz(areaCount, 0)

    If count <= 0 Then
        AreaCountToJsonValue = "null"
    Else
        AreaCountToJsonValue = CStr(count)
    End If
End Function

' ==========================================================================
' === SCORED ENTRY PROTECTION FUNCTIONS
' ==========================================================================

Private Function CheckScoredEntries_v3(ByVal lngShowID As Long, ByVal lngClassID As Long) As String
    On Error GoTo Check_Error

    Dim http As Object, jsonResponse As String, parsedJson As Object, dataItem As Object
    Dim supaClassID As Long, strLicenseKey As String
    Dim result As String

    strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & lngShowID), "")
    supaClassID = GetSupabaseClassID_v3(strLicenseKey, lngClassID)

    If supaClassID = 0 Then
        CheckScoredEntries_v3 = ""
        Exit Function
    End If

    Set http = CreateObject("MSXML2.ServerXMLHttp.6.0")
    Dim fullUrl As String
    fullUrl = SUPABASE_URL_2 & "/rest/v1/entries?select=armband_number,dog_call_name,handler_name&class_id=eq." & supaClassID & "&is_scored=eq.true"

    http.Open "GET", fullUrl, False
    http.setRequestHeader "apikey", SUPABASE_KEY_2
    http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
    http.send

    result = ""
    If http.Status = 200 Then
        Set parsedJson = ParseJson(http.responseText)
        ' VBA doesn't short-circuit And, so use nested If to avoid error on Nothing
        If Not parsedJson Is Nothing Then
            If parsedJson.count > 0 Then
                For Each dataItem In parsedJson
                    result = result & Nz(dataItem("armband_number"), "?") & "|" & _
                             Nz(dataItem("dog_call_name"), "Unknown") & "|" & _
                             Nz(dataItem("handler_name"), "Unknown") & ";"
                Next dataItem
            End If
        End If
    End If

    CheckScoredEntries_v3 = result

Check_Exit:
    Set http = Nothing: Set parsedJson = Nothing: Set dataItem = Nothing
    Exit Function
Check_Error:
    CheckScoredEntries_v3 = ""
    Resume Check_Exit
End Function


Private Function CheckScoredEntriesForTrial_Fallback(ByVal strTrialID As String) As String
    On Error GoTo ErrorHandler

    Dim strURL As String
    Dim strResponse As String
    Dim objHTTP As Object

    strURL = SUPABASE_URL_2 & "/rest/v1/entries?select=class_id,classes(class_name)&trial_id=eq." & strTrialID & "&is_scored=eq.true"

    Set objHTTP = CreateObject("MSXML2.XMLHTTP")
    objHTTP.Open "GET", strURL, False
    objHTTP.setRequestHeader "apikey", SUPABASE_KEY_2
    objHTTP.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2

    objHTTP.send

    If objHTTP.Status = 200 Then
        strResponse = objHTTP.responseText
        If strResponse <> "[]" Then
            CheckScoredEntriesForTrial_Fallback = ParseAndGroupScoredEntries(strResponse)
        Else
            CheckScoredEntriesForTrial_Fallback = ""
        End If
    Else
        CheckScoredEntriesForTrial_Fallback = ""
    End If

    Set objHTTP = Nothing
    Exit Function

ErrorHandler:
    Debug.Print "CheckScoredEntriesForTrial_Fallback Error: " & Err.Description
    CheckScoredEntriesForTrial_Fallback = ""
End Function

Private Function ParseTrialScoredResponse(ByVal strJSON As String) As String
    On Error Resume Next

    Dim strResult As String
    Dim i As Long
    Dim strClassName As String
    Dim lngCount As Long

    If strJSON = "[]" Or strJSON = "" Then
        ParseTrialScoredResponse = ""
        Exit Function
    End If

    strResult = ""

    Dim arrParts() As String
    Dim strPart As String

    strJSON = Replace(strJSON, "[{", "")
    strJSON = Replace(strJSON, "}]", "")
    arrParts = Split(strJSON, "},{")

    For i = LBound(arrParts) To UBound(arrParts)
        strPart = arrParts(i)

        strClassName = ExtractJSONValue(strPart, "class_name")
        lngCount = Val(ExtractJSONValue(strPart, "scored_count"))

        If strClassName <> "" And lngCount > 0 Then
            If strResult <> "" Then strResult = strResult & vbCrLf
            strResult = strResult & "  - " & strClassName & ": " & lngCount & " scored entries"
        End If
    Next i

    ParseTrialScoredResponse = strResult
End Function

Private Function ParseAndGroupScoredEntries(ByVal strJSON As String) As String
    On Error Resume Next

    Dim dict As Object
    Set dict = CreateObject("Scripting.Dictionary")

    Dim strClassName As String
    Dim arrEntries() As String
    Dim i As Long
    Dim strResult As String

    If InStr(strJSON, "is_scored") > 0 Or Len(strJSON) > 10 Then
        ParseAndGroupScoredEntries = "(Multiple classes have scored entries - check Supabase for details)"
    Else
        ParseAndGroupScoredEntries = ""
    End If
End Function


Private Function CheckScoredEntriesForTrial_v3(ByVal lngShowID As Long, ByVal lngTrialID As Long) As String
    On Error GoTo ErrorHandler

    Dim strURL As String
    Dim strResponse As String
    Dim objHTTP As Object
    Dim strLicenseKey As String
    Dim lngSupabaseTrialID As Long
    Dim strClassIDs As String
    Dim parsedClasses As Object
    Dim classItem As Object

    strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & lngShowID), "")
    If strLicenseKey = "" Then
        CheckScoredEntriesForTrial_v3 = ""
        Exit Function
    End If

    lngSupabaseTrialID = GetSupabaseTrialID_v3(strLicenseKey, lngTrialID)
    If lngSupabaseTrialID = 0 Then
        CheckScoredEntriesForTrial_v3 = ""
        Exit Function
    End If

    Set objHTTP = CreateObject("MSXML2.XMLHTTP")

    strURL = SUPABASE_URL_2 & "/rest/v1/classes?select=id&trial_id=eq." & lngSupabaseTrialID

    objHTTP.Open "GET", strURL, False
    objHTTP.setRequestHeader "apikey", SUPABASE_KEY_2
    objHTTP.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
    objHTTP.send

    If objHTTP.Status <> 200 Then
        CheckScoredEntriesForTrial_v3 = ""
        Exit Function
    End If

    strClassIDs = ""
    Set parsedClasses = ParseJson(objHTTP.responseText)
    If parsedClasses Is Nothing Or parsedClasses.count = 0 Then
        CheckScoredEntriesForTrial_v3 = ""
        Exit Function
    End If

    For Each classItem In parsedClasses
        If strClassIDs <> "" Then strClassIDs = strClassIDs & ","
        strClassIDs = strClassIDs & CLng(classItem("id"))
    Next classItem

    strURL = SUPABASE_URL_2 & "/rest/v1/entries?select=id,armband_number,handler_name,dog_call_name" & _
             "&class_id=in.(" & strClassIDs & ")" & _
             "&is_scored=eq.true" & _
             "&license_key=eq." & strLicenseKey

    objHTTP.Open "GET", strURL, False
    objHTTP.setRequestHeader "apikey", SUPABASE_KEY_2
    objHTTP.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
    objHTTP.send

    If objHTTP.Status = 200 Then
        strResponse = objHTTP.responseText
        If strResponse <> "[]" And Len(strResponse) > 2 Then
            CheckScoredEntriesForTrial_v3 = ParseTrialScoredEntriesResponse(strResponse)
        Else
            CheckScoredEntriesForTrial_v3 = ""
        End If
    Else
        CheckScoredEntriesForTrial_v3 = ""
    End If

    Set objHTTP = Nothing
    Set parsedClasses = Nothing
    Exit Function

ErrorHandler:
    Debug.Print "CheckScoredEntriesForTrial_v3 Error: " & Err.Description
    CheckScoredEntriesForTrial_v3 = ""
End Function

Private Function UnlockClassForReupload_v3(ByVal lngShowID As Long, ByVal lngClassID As Long) As Long
    On Error GoTo ErrorHandler

    Dim strURL As String
    Dim strResponse As String
    Dim objHTTP As Object
    Dim lngSupabaseClassID As Long
    Dim strLicenseKey As String

    strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & lngShowID), "")
    lngSupabaseClassID = GetSupabaseClassID_v3(strLicenseKey, lngClassID)

    If lngSupabaseClassID = 0 Then
        Debug.Print "UnlockClassForReupload_v3: Could not find Supabase class ID for Access class " & lngClassID
        UnlockClassForReupload_v3 = 0
        Exit Function
    End If

    strURL = SUPABASE_URL_2 & "/rest/v1/rpc/unlock_class_for_reupload"

    Set objHTTP = CreateObject("MSXML2.XMLHTTP")
    objHTTP.Open "POST", strURL, False
    objHTTP.setRequestHeader "apikey", SUPABASE_KEY_2
    objHTTP.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
    objHTTP.setRequestHeader "Content-Type", "application/json"

    objHTTP.send "{""p_class_id"": " & lngSupabaseClassID & "}"

    If objHTTP.Status = 200 Then
        strResponse = objHTTP.responseText
        UnlockClassForReupload_v3 = Val(Replace(Replace(strResponse, "[", ""), "]", ""))
    Else
        Debug.Print "UnlockClassForReupload_v3 failed: " & objHTTP.Status & " - " & objHTTP.responseText
        UnlockClassForReupload_v3 = 0
    End If

    Set objHTTP = Nothing
    Exit Function

ErrorHandler:
    Debug.Print "UnlockClassForReupload_v3 Error: " & Err.Description
    UnlockClassForReupload_v3 = 0
End Function

Private Function UnlockTrialForReupload_v3(ByVal lngShowID As Long, ByVal lngTrialID As Long) As Long
    On Error GoTo ErrorHandler

    Dim strURL As String
    Dim strResponse As String
    Dim objHTTP As Object
    Dim lngSupabaseTrialID As Long
    Dim strLicenseKey As String

    strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & lngShowID), "")

    If strLicenseKey = "" Then
        Debug.Print "UnlockTrialForReupload_v3: No license key found for show " & lngShowID
        UnlockTrialForReupload_v3 = 0
        Exit Function
    End If

    lngSupabaseTrialID = GetSupabaseTrialID_v3(strLicenseKey, lngTrialID)

    If lngSupabaseTrialID = 0 Then
        Debug.Print "UnlockTrialForReupload_v3: Could not find Supabase trial ID for Access trial " & lngTrialID
        UnlockTrialForReupload_v3 = 0
        Exit Function
    End If

    strURL = SUPABASE_URL_2 & "/rest/v1/rpc/unlock_trial_for_reupload"

    Set objHTTP = CreateObject("MSXML2.XMLHTTP")
    objHTTP.Open "POST", strURL, False
    objHTTP.setRequestHeader "apikey", SUPABASE_KEY_2
    objHTTP.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
    objHTTP.setRequestHeader "Content-Type", "application/json"

    objHTTP.send "{""p_trial_id"": " & lngSupabaseTrialID & "}"

    If objHTTP.Status = 200 Then
        strResponse = objHTTP.responseText
        UnlockTrialForReupload_v3 = Val(Replace(Replace(strResponse, "[", ""), "]", ""))
    Else
        Debug.Print "UnlockTrialForReupload_v3 failed: " & objHTTP.Status & " - " & objHTTP.responseText
        UnlockTrialForReupload_v3 = 0
    End If

    Set objHTTP = Nothing
    Exit Function

ErrorHandler:
    Debug.Print "UnlockTrialForReupload_v3 Error: " & Err.Description
    UnlockTrialForReupload_v3 = 0
End Function

' =============================================================================
' WARNING DIALOGS
' =============================================================================
Private Function ShowScoredEntriesWarning(ByVal scoredEntriesList As String, ByVal className As String) As Integer
    On Error GoTo Err_Handler

    Dim strOpenArgs As String
    strOpenArgs = className & "|" & scoredEntriesList

    DoCmd.OpenForm "dlg_ScoredEntriesWarning", acNormal, , , , acDialog, strOpenArgs

    Dim intResult As Integer
    On Error Resume Next
    intResult = Forms("dlg_ScoredEntriesWarning").ReturnValue
    If Err.Number <> 0 Then intResult = 0
    On Error GoTo Err_Handler

    On Error Resume Next
    DoCmd.Close acForm, "dlg_ScoredEntriesWarning"
    On Error GoTo 0

    Select Case intResult
        Case 0: ShowScoredEntriesWarning = vbAbort
        Case 1: ShowScoredEntriesWarning = vbIgnore
        Case 2: ShowScoredEntriesWarning = vbRetry
        Case Else: ShowScoredEntriesWarning = vbAbort
    End Select
    Exit Function

Err_Handler:
    ShowScoredEntriesWarning = vbAbort
End Function

Private Function ShowTrialScoredEntriesWarning(ByVal scoredEntriesList As String) As Integer
    On Error GoTo Err_Handler

    Dim strOpenArgs As String
    strOpenArgs = "Multiple Classes (Trial Upload)" & "|" & scoredEntriesList

    DoCmd.OpenForm "dlg_ScoredEntriesWarning", acNormal, , , , acDialog, strOpenArgs

    Dim intResult As Integer
    On Error Resume Next
    intResult = Forms("dlg_ScoredEntriesWarning").ReturnValue
    If Err.Number <> 0 Then intResult = 0
    On Error GoTo Err_Handler

    On Error Resume Next
    DoCmd.Close acForm, "dlg_ScoredEntriesWarning"
    On Error GoTo 0

    Select Case intResult
        Case 0: ShowTrialScoredEntriesWarning = vbAbort
        Case 1: ShowTrialScoredEntriesWarning = vbIgnore
        Case 2: ShowTrialScoredEntriesWarning = vbRetry
        Case Else: ShowTrialScoredEntriesWarning = vbAbort
    End Select
    Exit Function

Err_Handler:
    ShowTrialScoredEntriesWarning = vbAbort
End Function

' =============================================================================
' TIME CONVERSION HELPER
' =============================================================================
Private Function ConvertTimeToSeconds(ByVal strTime As String) As Double
    On Error Resume Next
    ConvertTimeToSeconds = 0

    If Len(Trim(strTime)) = 0 Then Exit Function

    Dim parts() As String
    Dim minutes As Double
    Dim seconds As Double

    If InStr(strTime, ":") > 0 Then
        parts = Split(strTime, ":")
        minutes = Val(parts(0))
        seconds = Val(parts(1))
        ConvertTimeToSeconds = (minutes * 60) + seconds
    Else
        ConvertTimeToSeconds = Val(strTime)
    End If
End Function

' =============================================================================
' JSON PARSING HELPERS
' =============================================================================
Private Function ParseScoredEntriesResponse(ByVal strJSON As String) As String
    On Error Resume Next

    Dim strResult As String
    Dim i As Long
    Dim strArmband As String
    Dim strHandler As String
    Dim strDog As String
    Dim arrEntries() As String
    Dim strEntry As String
    Dim lngCount As Long

    strJSON = Replace(strJSON, "[{", "")
    strJSON = Replace(strJSON, "}]", "")
    arrEntries = Split(strJSON, "},{")

    strResult = ""
    lngCount = 0

    For i = LBound(arrEntries) To UBound(arrEntries)
        strEntry = arrEntries(i)

        strArmband = ExtractJSONValue(strEntry, "armband_number")
        strHandler = ExtractJSONValue(strEntry, "handler_name")
        strDog = ExtractJSONValue(strEntry, "dog_call_name")

        If strArmband <> "" Then
            lngCount = lngCount + 1
            If lngCount <= 10 Then
                strResult = strResult & "  #" & strArmband & " - " & strDog & " (" & strHandler & ")" & vbCrLf
            End If
        End If
    Next i

    If lngCount > 10 Then
        strResult = strResult & "  ... and " & (lngCount - 10) & " more" & vbCrLf
    End If

    strResult = lngCount & " scored entries:" & vbCrLf & strResult

    ParseScoredEntriesResponse = strResult
End Function

Private Function ParseTrialScoredEntriesResponse(ByVal strJSON As String) As String
    On Error Resume Next

    Dim lngTotal As Long
    Dim arrEntries() As String

    strJSON = Replace(strJSON, "[{", "")
    strJSON = Replace(strJSON, "}]", "")
    arrEntries = Split(strJSON, "},{")

    lngTotal = UBound(arrEntries) - LBound(arrEntries) + 1

    ParseTrialScoredEntriesResponse = lngTotal & " scored entries across multiple classes." & vbCrLf & _
                                       "(Detailed list available in Supabase)"
End Function

Private Function ExtractJSONValue(ByVal strJSON As String, ByVal strKey As String) As String
    On Error Resume Next

    Dim lngStart As Long
    Dim lngEnd As Long
    Dim strSearch As String

    strSearch = """" & strKey & """:"
    lngStart = InStr(strJSON, strSearch)

    If lngStart = 0 Then
        ExtractJSONValue = ""
        Exit Function
    End If

    lngStart = lngStart + Len(strSearch)

    If Mid(strJSON, lngStart, 1) = """" Then
        lngStart = lngStart + 1
        lngEnd = InStr(lngStart, strJSON, """")
    Else
        lngEnd = InStr(lngStart, strJSON, ",")
        If lngEnd = 0 Then lngEnd = InStr(lngStart, strJSON, "}")
    End If

    If lngEnd > lngStart Then
        ExtractJSONValue = Mid(strJSON, lngStart, lngEnd - lngStart)
    Else
        ExtractJSONValue = ""
    End If
End Function

' ==========================================================================
' === DOWNLOAD PROTECTION FUNCTIONS (Protect Access scores from overwrite)
' ==========================================================================

Private Function CheckScoredEntriesInAccess_v3(ByVal lngClassID As Long) As String
    On Error GoTo Check_Error

    Dim db As DAO.Database
    Dim rs As DAO.Recordset
    Dim strSQL As String
    Dim result As String

    Set db = CurrentDb

    strSQL = "SELECT E.Armband, D.CallName, P.FullName AS HandlerName " & _
             "FROM ((tbl_Entry AS E " & _
             "LEFT JOIN tbl_Exhibitor AS D ON E.exhibitorID_FK = D.exhibitorID) " & _
             "LEFT JOIN tbl_Person AS P ON E.HandlerID_FK = P.personID) " & _
             "WHERE E.classID_FK = " & lngClassID & " " & _
             "AND (E.Qualified = True OR E.NQ = True OR E.Excused = True OR E.Absent = True OR E.Disqualified = True)"

    Set rs = db.OpenRecordset(strSQL, dbOpenSnapshot)

    result = ""
    If Not rs.EOF Then
        rs.MoveFirst
        Do While Not rs.EOF
            result = result & Nz(rs!Armband, "?") & " - " & _
                     Nz(rs!CallName, "Unknown") & " - " & _
                     Nz(rs!HandlerName, "Unknown") & vbCrLf
            rs.MoveNext
        Loop
    End If

    rs.Close
    CheckScoredEntriesInAccess_v3 = result

Check_Exit:
    Set rs = Nothing
    Set db = Nothing
    Exit Function

Check_Error:
    Debug.Print "CheckScoredEntriesInAccess_v3 Error: " & Err.Description
    CheckScoredEntriesInAccess_v3 = ""
    Resume Check_Exit
End Function

Private Function IsEntryScoredInAccess(ByVal lngEntryID As Long) As Boolean
    On Error GoTo Check_Error

    Dim varResult As Variant

    varResult = DLookup("entryID", "tbl_Entry", _
                        "entryID = " & lngEntryID & " AND " & _
                        "(Qualified = True OR NQ = True OR Excused = True OR Absent = True OR Disqualified = True)")

    IsEntryScoredInAccess = Not IsNull(varResult)
    Exit Function

Check_Error:
    Debug.Print "IsEntryScoredInAccess Error: " & Err.Description
    IsEntryScoredInAccess = False
End Function

Private Function ShowAccessScoredEntriesWarning(ByVal scoredEntriesList As String, ByVal className As String) As Integer
    On Error GoTo Err_Handler

    Dim strOpenArgs As String
    strOpenArgs = "ACCESS|" & className & "|" & scoredEntriesList

    DoCmd.OpenForm "dlg_ScoredEntriesWarning", acNormal, , , , acDialog, strOpenArgs

    Dim intResult As Integer
    On Error Resume Next
    intResult = Forms("dlg_ScoredEntriesWarning").ReturnValue
    If Err.Number <> 0 Then intResult = 0
    On Error GoTo Err_Handler

    On Error Resume Next
    DoCmd.Close acForm, "dlg_ScoredEntriesWarning"
    On Error GoTo 0

    Select Case intResult
        Case 0: ShowAccessScoredEntriesWarning = vbAbort
        Case 1: ShowAccessScoredEntriesWarning = vbIgnore
        Case 2: ShowAccessScoredEntriesWarning = vbRetry
        Case Else: ShowAccessScoredEntriesWarning = vbAbort
    End Select
    Exit Function

Err_Handler:
    ShowAccessScoredEntriesWarning = vbAbort
End Function

' ==========================================================================
' === LEGACY ROUTINES
' ==========================================================================

Public Function myK9Q_License_Status(iShowID As Integer, ByVal strClubname As String)

26250   On Error Resume Next

        Dim strAction As String, strKey As String, strStartDate As String, strProduct As String
        Dim db As DAO.Database
        Dim rs As DAO.Recordset
        Dim dExpDate As Date

26260   If CheckInternetConnectivity = True Then

26270       Set db = CurrentDb
26280       Set rs = db.OpenRecordset("SELECT MobileAppLicKey, MobileAppLicKeyStatus FROM tbl_Show WHERE ShowID = " & iShowID)


26290       strAction = "status-check"
26300       strProduct = "myK9Q"

26310       strStartDate = DLookup("StartDate", "tbl_Show", "showID = " & iShowID)
26320       strKey = DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID)
26330       strClubname = strClubname & "-" & strStartDate


26340       If InStr(1, strKey, "myK9Q") Then
26350           rs.Edit
26360           rs!MobileAppLicKeyStatus = "Verifying Key Status"
26370           rs!MobileAppLicKeyStatus = WebRequest(strAction, strProduct, strKey, strClubname, dExpDate)
26380           rs.Update

26390           If InStr(rs!MobileAppLicKeyStatus, "License key is Active") Then
26400               myK9Q_License_Status = True
26410           Else
26420               myK9Q_License_Status = False
26430           End If
26440       End If

26450   Else
26460       MsgBox "Unable to validate License Key without Internet Connectivity", vbInformation, "No Internet Connectivity"
26470       Exit Function
26480   End If

End Function


' ==========================================================================
' === UPDATE SHOW DETAILS (v3 - REST API)
' ==========================================================================

Public Sub UpdateShowDetails_v3()
52500     On Error GoTo UpdateShow_Error

          Dim strmyK9Q As String
          Dim strClubname As String
          Dim strChairmanName As String
          Dim strChairmanEmail As String
          Dim strChairmanPhone As String
          Dim strSecretaryName As String
          Dim strSecretaryEmail As String
          Dim strSecretaryPhone As String
          Dim strSiteState As String
          Dim strClubWebsite As String
          Dim strNote As String
          Dim iShowID As Long
          Dim iClubID As Long
          Dim strLicenseKey As String
          Dim http As Object
          Dim json As String


52510     iShowID = Forms!frm_Show.txtShowID
52520     iClubID = Nz(DLookup("ClubID_FK", "tbl_Show", "ShowID = " & iShowID), 0)
52525     strLicenseKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID), "")
52530     strmyK9Q = Nz(DLookup("MobileAppLicKeyStatus", "tbl_Show", "showID = " & iShowID), "")

52540     If InStr(1, strmyK9Q, "Active and Valid") Then

52550         strClubname = Nz(DLookup("ClubName", "tbl_Club", "ClubID = " & iClubID), "")

52560         DoCmd.OpenForm "frm_Progress_myK9Q", acNormal
52570         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Verifying License Key for Club ID: " & iClubID

52580         Call myK9Q_License_Status(CInt(iShowID), strClubname)

52590         DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo

52600     Else
52610         MsgBox "Unable to Upload data without a Valid myK9Q License Key. Check myK9Q License Key and Status and Retry.", vbInformation, "myK9Q License Key"
52620         Exit Sub
52630     End If

52640     strChairmanName = Nz(DLookup("FullName", "tbl_Person", "personID = " & Nz(Forms!frm_Show.ChairmanID_FK, 0)), "")
52650     strChairmanEmail = Nz(DLookup("Email", "tbl_Person", "personID = " & Nz(Forms!frm_Show.ChairmanID_FK, 0)), "")
52660     strChairmanPhone = Nz(DLookup("Phone", "tbl_Person", "personID = " & Nz(Forms!frm_Show.ChairmanID_FK, 0)), "")
52670     strSecretaryName = Nz(DLookup("FullName", "tbl_Person", "personID = " & Nz(Forms!frm_Show.SecretaryID_FK, 0)), "")
52680     strSecretaryEmail = Nz(DLookup("Email", "tbl_Person", "personID = " & Nz(Forms!frm_Show.SecretaryID_FK, 0)), "")
52690     strSecretaryPhone = Nz(DLookup("Phone", "tbl_Person", "personID = " & Nz(Forms!frm_Show.SecretaryID_FK, 0)), "")
52700     strSiteState = Nz(DLookup("StateName", "tbl_State", "StateID = " & Nz(Forms!frm_Show.SiteStateID_FK, 0)), "")
52710     strClubWebsite = Nz(DLookup("Website", "tbl_Club", "ClubID = " & iClubID), "")
52720     strNote = Nz(DLookup("note", "tbl_show", "showID = " & iShowID), "")
52730     strNote = Replace(strNote, "<div>", "")
52740     strNote = Replace(strNote, "</div>", "")

          ' Build date strings first to avoid concatenation issues
          Dim strStartDate As String
          Dim strEndDate As String
          Dim strShowName As String
          strShowName = JsonSafe(Nz(Forms!frm_Show.ShowName, ""))
          strStartDate = Format(Nz(Forms!frm_Show.StartDate, Now), "yyyy-mm-dd")
          strEndDate = Format(Nz(Forms!frm_Show.EndDate, Now), "yyyy-mm-dd")

52750     json = "{" & _
                   """show_name"":""" & strShowName & """," & _
                   """club_name"":""" & JsonSafe(strClubname) & """," & _
                   """start_date"":""" & strStartDate & """," & _
                   """end_date"":""" & strEndDate & """," & _
                   """chairman_name"":""" & JsonSafe(strChairmanName) & """," & _
                   """chairman_email"":""" & JsonSafe(strChairmanEmail) & """," & _
                   """chairman_phone"":""" & JsonSafe(strChairmanPhone) & """," & _
                   """secretary_name"":""" & JsonSafe(strSecretaryName) & """," & _
                   """secretary_email"":""" & JsonSafe(strSecretaryEmail) & """," & _
                   """secretary_phone"":""" & JsonSafe(strSecretaryPhone) & """," & _
                   """website"":""" & JsonSafe(strClubWebsite) & """," & _
                   """event_url"":""" & JsonSafe(Nz(Forms!frm_Show.eventurl, "")) & """," & _
                   """site_name"":""" & JsonSafe(Nz(Forms!frm_Show.SiteName, "")) & """," & _
                   """site_address"":""" & JsonSafe(Nz(Forms!frm_Show.SiteAddress, "")) & """," & _
                   """site_city"":""" & JsonSafe(Nz(Forms!frm_Show.SiteCity, "")) & """," & _
                   """site_state"":""" & JsonSafe(strSiteState) & """," & _
                   """site_zip"":""" & JsonSafe(Nz(Forms!frm_Show.SiteZip, "")) & """," & _
                   """notes"":""" & JsonSafe(strNote) & """" & _
                "}"

52760     Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
52770     http.Open "PATCH", SUPABASE_URL_2 & "/rest/v1/shows?license_key=eq." & strLicenseKey, False
52780     http.setRequestHeader "apikey", SUPABASE_KEY_2
52790     http.setRequestHeader "Authorization", "Bearer " & SUPABASE_KEY_2
52800     http.setRequestHeader "Content-Type", "application/json"
52810     http.setRequestHeader "Prefer", "return=representation"
52820     http.send json

52830     If http.Status >= 200 And http.Status < 300 Then
52835         If http.responseText = "[]" Then
52836             MsgBox "Show not found in myK9Q database. Activate the myK9Q license key to upload the show first.", vbExclamation, "Show Not Found"
52837         Else
52840             MsgBox "Show Details updated in myK9Q cloud database", vbInformation, "Show Details Update"
52838         End If
52850     Else
52860         MsgBox "Error updating show details:" & vbCrLf & http.Status & " - " & http.responseText, vbCritical, "Update Failed"
52870     End If

52880     Set http = Nothing
52890     Exit Sub

UpdateShow_Error:
52900     MsgBox "Error in UpdateShowDetails_v3: " & Err.Description, vbCritical
52910     Set http = Nothing
End Sub
