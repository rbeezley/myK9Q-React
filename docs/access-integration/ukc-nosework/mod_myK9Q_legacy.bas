Attribute VB_Name = "mod_myK9Q"
Option Compare Database
Option Explicit
Private Declare PtrSafe Sub Sleep Lib "kernel32" (ByVal dwMilliseconds As Long)

Public Sub LinkPostgres(Optional bolForce As Boolean = False)
          Dim strCon

          'Driver={PostgreSQL ANSI};Server=IP address;Port=5432;Database=myDataBase;Uid=myUsername;Pwd=myPassword;
          'strCnn = "ODBC;DRIVER={PostgreSQL ANSI};Server=db.ggreahsjqzombkvagxle.supabase.co;Port=5432;Database=postgres;Uid=postgres;Pwd=XsjX8EoQr9tduoJl"
          'MSysObject Connect Field
          'DRIVER={PostgreSQL ANSI};DATABASE=postgres;SERVER=db.ggreahsjqzombkvagxle.supabase.co;PORT=5432;CA=d;A7=100;B0=255;B1=8190;BI=0;C2=;D6=-101;CX=1c305008b;A1=7.4
          
          'strCon = "ODBC;DRIVER={PostgreSQL ANSI};Server=db.ggreahsjqzombkvagxle.supabase.co;Port=5432;Database=postgres;Uid=postgres;Pwd=XsjX8EoQr9tduoJl"

           'OLD connection - strCon = "ODBC;DRIVER={PostgreSQL ANSI};Server=aws-0-us-west-1.pooler.supabase.com;Port=5432;Database=postgres;Uid=postgres.ggreahsjqzombkvagxle;Pwd=XsjX8EoQr9tduoJl"
43630      strCon = "ODBC;DRIVER={PostgreSQL ANSI};Server=aws-0-us-west-1.pooler.supabase.com;Port=5432;Database=postgres;Uid=postgres.ggreahsjqzombkvagxle;Pwd=XsjX8EoQr9tduoJl"
          
          'Delete Linked Tables First
43640     Call DeleteLinkPostgres
          
          'Link myK9Q Postgres Tables
43650     DoCmd.TransferDatabase acLink, "ODBC", strCon, acTable, "public.tbl_show_queue", "public_tbl_show_queue"
43660     DoCmd.TransferDatabase acLink, "ODBC", strCon, acTable, "public.tbl_trial_queue", "public_tbl_trial_queue"
43670     DoCmd.TransferDatabase acLink, "ODBC", strCon, acTable, "public.tbl_class_queue", "public_tbl_class_queue"
43680     DoCmd.TransferDatabase acLink, "ODBC", strCon, acTable, "public.tbl_entry_queue", "public_tbl_entry_queue"

End Sub

Public Sub DeleteLinkPostgres()

      Dim td As DAO.TableDef

43690     For Each td In CurrentDb.TableDefs
              'Debug.Print td.Name
              
43700         If td.Name = "public_tbl_show_queue" Then
43710             CurrentDb.TableDefs.Delete td.Name
43720         ElseIf td.Name = "public_tbl_trial_queue" Then
43730             CurrentDb.TableDefs.Delete td.Name
43740         ElseIf td.Name = "public_tbl_class_queue" Then
43750             CurrentDb.TableDefs.Delete td.Name
43760         ElseIf td.Name = "public_tbl_entry_queue" Then
43770             CurrentDb.TableDefs.Delete td.Name
43780         End If
              
43790     Next
End Sub

Public Function myK9Q_License_Status(iShowID As Integer, strClubname As String)

43800   On Error Resume Next

        Dim strAction As String, strKey As String, strStartDate As String, strProduct As String
        Dim db As DAO.Database
        Dim rs As DAO.Recordset
        Dim dExpDate As Date
        
43810   If CheckInternetConnectivity = True Then

43820       Set db = CurrentDb
43830       Set rs = db.OpenRecordset("SELECT MobileAppLicKey, MobileAppLicKeyStatus FROM tbl_Show WHERE ShowID = " & iShowID)
          
          
43840       strAction = "status-check"
43850       strProduct = "myK9Q"
          
43860       strStartDate = DLookup("StartDate", "tbl_Show", "showID = " & iShowID)
43870       strKey = DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID)
43880       strClubname = strClubname & "-" & strStartDate
          
          
43890       If InStr(1, strKey, "myK9Q") Then

43900           rs.Edit
43910           rs!MobileAppLicKeyStatus = "Verifying Key Status"
43920           rs!MobileAppLicKeyStatus = WebRequest(strAction, strProduct, strKey, strClubname, dExpDate)
43930           rs.Update
               
43940           If InStr(rs!MobileAppLicKeyStatus, "License key is Active") Then
43950               myK9Q_License_Status = True
43960           Else
43970               myK9Q_License_Status = False
43980           End If
43990       End If

44000   Else
44010       MsgBox "Unable to validate License Keywithout Internet Connectivity", vbInformation, "No Internet Connectivity"
44020       Exit Function
44030   End If

End Function

Public Sub myK9QDelete(strCalledBy)

          Dim strMobileAppLicKey As String
          Dim iClassID As Integer
          Dim iTrialID As Integer
          Dim iShowID As Integer
          Dim strResult As String
          Dim intEntries As Integer
          Dim intEntriesA As Integer
          Dim strSQL As String
          Dim qdf As QueryDef
          Dim strElement As String
          Dim strLevel As String
         
          
44040     iShowID = TempVars!tmpShowID.value
44050     strMobileAppLicKey = Nz(DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID), 0)

44060     If strMobileAppLicKey = "0" Then
44070           MsgBox "Show does not have an active myK9Q App License Key"
44080           Exit Sub
44090     End If
          
44100     strResult = MsgBox("Are you sure you want to Delete data from myK9Q?", vbQuestion + vbYesNo, "Delete myK9Q Data")
         
44110     If strResult = vbYes Then
              'Link myK9Q Tables
44120         Call LinkPostgres
          
44130     If strCalledBy = "Show" Then

              'Progress
44140         intEntries = DCount("entryID", "tbl_Entry", "ShowID_FK = " & iShowID)
44150         DoCmd.OpenForm "frm_Progress_myK9Q"
44160         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Deleting " & intEntries & " Entries for Show ID: " & iShowID
44170         Forms!frm_Progress_myK9Q.Repaint

              'Delete Show
44180         strSQL = "DELETE * FROM public_tbl_show_queue WHERE mobile_app_lic_key = '" & strMobileAppLicKey & "';"
              'Debug.Print strSQL
44190         CurrentDb.Execute strSQL
              
              'Delete Trials
44200         strSQL = "DELETE * FROM public_tbl_trial_queue WHERE mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44210         CurrentDb.Execute strSQL
              
              'Delete Classes
44220         strSQL = "DELETE * FROM public_tbl_class_queue WHERE mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44230         CurrentDb.Execute strSQL
              
              'Delete Entries
44240         Set qdf = CurrentDb.QueryDefs("qry_Delete_myK9Q_PT")
              
              'Novice
44250         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Novice' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44260         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44270         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Advanced
44280         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Advanced' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44290         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44300         CurrentDb.Execute "qry_Delete_myK9Q_PT"

              'Superior
44310         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Superior' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44320         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44330         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Excellent
44340         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Excellent' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44350         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44360         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Master
44370         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Master' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44380         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44390         CurrentDb.Execute "qry_Delete_myK9Q_PT"

              'Elite
44400         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Elite' AND mobile_app_lic_key = '" & strMobileAppLicKey & "';"
44410         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44420         CurrentDb.Execute "qry_Delete_myK9Q_PT"

44430     ElseIf strCalledBy = "Trial" Then
              
              'Progress
44440         iTrialID = TempVars!tmpTrialID.value
44450         intEntries = DCount("entryID", "public_tbl_entry_queue", "trialid_fk = " & iTrialID)

44460         DoCmd.OpenForm "frm_Progress_myK9Q"
44470         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Deleting " & intEntries & " Entries for Trial ID: " & iTrialID
44480         Forms!frm_Progress_myK9Q.Repaint

              'Delete from Trial Table
44490         strSQL = "DELETE public_tbl_trial_queue.trialid FROM public_tbl_trial_queue WHERE public_tbl_trial_queue.mobile_app_lic_key = '" & strMobileAppLicKey & "' AND public_tbl_trial_queue.trialid = " & iTrialID & ";"
              'Debug.Print strSQL
44500         CurrentDb.Execute strSQL
              
              'Delete from Class Table
44510         strSQL = "DELETE public_tbl_class_queue.trialid_fk FROM public_tbl_class_queue WHERE public_tbl_class_queue.mobile_app_lic_key = '" & strMobileAppLicKey & "' AND public_tbl_class_queue.trialid_fk = " & iTrialID & ";"
44520         CurrentDb.Execute strSQL
              
              'Delete from Entry Table
44530         Set qdf = CurrentDb.QueryDefs("qry_Delete_myK9Q_PT")
              
              'Novice
44540         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Novice' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44550         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44560         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Advanced
44570         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Advanced' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44580         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44590         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Superior
44600         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Superior' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44610         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44620         CurrentDb.Execute "qry_Delete_myK9Q_PT"

              'Excellent
44630         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Excellent' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44640         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44650         CurrentDb.Execute "qry_Delete_myK9Q_PT"
              
              'Master
44660         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Master' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44670         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44680         CurrentDb.Execute "qry_Delete_myK9Q_PT"

              'Elite
44690         strSQL = "DELETE FROM public.tbl_entry_queue WHERE level = 'Elite' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID & ";"
44700         qdf.SQL = strSQL
              'Debug.Print qdf.SQL
44710         CurrentDb.Execute "qry_Delete_myK9Q_PT"

44720     ElseIf strCalledBy = "Class" Then
              
              'Progress
44730         iClassID = TempVars!tmpClassID.value
44740         intEntries = DCount("entryID", "tbl_Entry", "ClassID_FK = " & iClassID)

44750         DoCmd.OpenForm "frm_Progress_myK9Q"
44760         Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Deleting " & intEntries & " Entries for Class ID: " & iClassID
44770         Forms!frm_Progress_myK9Q.Repaint

44780         strSQL = "DELETE public_tbl_entry_queue.classid_fk FROM public_tbl_entry_queue WHERE (((public_tbl_entry_queue.classid_fk)= " & iClassID & "));"
44790         CurrentDb.Execute strSQL

              'Figure out if A or B entries exist for this class
44800         iTrialID = Forms!frm_Class_Main.trialID
44810         strElement = Forms!frm_Class_Main.txtElement
44820         strLevel = Forms!frm_Class_Main.txtLevel
44830         intEntriesA = DCount("entryID", "public_tbl_entry_queue", "element = '" & strElement & "' AND level = '" & strLevel & "' AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND trialid_fk = " & iTrialID)
            
44840         If intEntriesA = 0 Then
44850               strSQL = "DELETE public_tbl_class_queue.classid FROM public_tbl_class_queue WHERE mobile_app_lic_key = '" & strMobileAppLicKey & "' AND element = '" & strElement & "' AND level = '" & strLevel & "' AND trialid_fk = " & iTrialID & ";"
44860                CurrentDb.Execute strSQL
44870         End If

44880     End If
          
44890     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
          
44900     MsgBox "Requested Data has been Deleted from the myK9Q app", vbInformation, "Data Deleted"
44910   End If

End Sub

Public Sub myK9Q_Class_Result_Download()

          Dim iEntries As Integer
          Dim iShowID As Integer
          Dim iTrialID As Integer
          Dim iClassID As Integer
          Dim iEntryID As Integer
          Dim iCount As Integer
          Dim i As Integer
          Dim strSQL As String
          Dim strMobileAppLicKey As String
          Dim db As DAO.Database
          Dim rs As DAO.Recordset
          Dim strmyK9Q As String
          Dim strClubname As String
          Dim intCount As Integer
          Dim iClubID As Integer
          
44920     Set db = CurrentDb
          
          'Link myK9Q Tables
44930     Call LinkPostgres
          
44940     iClassID = Forms!frm_Class_Main.txtClassID
44950     iTrialID = DLookup("trialID_FK", "tbl_Class", "classID = " & iClassID)
44960     iShowID = DLookup("ShowID_FK", "tbl_Trial", "trialID = " & iTrialID)
44970     iClubID = Nz(DLookup("ClubID_FK", "tbl_Show", "ShowID = " & iShowID), 0)
44980     strMobileAppLicKey = DLookup("MobileAppLicKey", "tbl_Show", "showID = " & iShowID)

          'Check if Valid License
44990     strmyK9Q = Nz(DLookup("MobileAppLicKeyStatus", "tbl_Show", "showID = " & iShowID), 0)
          
45000     If InStr(1, strmyK9Q, "Active and Valid") Then

45010             strClubname = Forms!frm_Class_Main.txtClubName
45020             intCount = 1
45030             i = 1
          
                  'Progress Bar
45040             DoCmd.OpenForm "frm_Progress_myK9Q", acNormal
45050             Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Verifying License Key for Club ID: " & iClubID
                
45060             Call myK9Q_License_Status(iShowID, strClubname)
45070             intCount = DCount("entryID", "tbl_Entry", "TrialID_FK = " & iTrialID)

45080     Else
45090         MsgBox "Unable to Upload data without a Valid myK9Q License Key. Check myK9Q License Key and Status and Retry.", vbInformation, "myK9Q License Key"
45100         Exit Sub
45110     End If
          
          'Progress Dialog
45120     iEntries = DCount("entryID", "tbl_Entry", "ClassID_FK = " & iClassID)
45130     DoCmd.OpenForm "frm_Progress_myK9Q"
45140     Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Downloading Results for " & iEntries & " Entries for Class ID: " & iClassID
45150     Forms!frm_Progress_myK9Q.Repaint
                
                
          'Update Results in Entry table from myK9Q
45160     strSQL = "UPDATE tbl_Show INNER JOIN ((public_tbl_entry_queue INNER JOIN tbl_Entry ON public_tbl_entry_queue.entryid = tbl_Entry.entryID) INNER JOIN tbl_Trial ON tbl_Entry.TrialID_FK = tbl_Trial.trialID) ON (tbl_Show.MobileAppLicKey = public_tbl_entry_queue.mobile_app_lic_key) AND (tbl_Show.showID = tbl_Trial.ShowID_FK) SET tbl_Entry.NQReason = [public_tbl_entry_queue].[Reason], tbl_Entry.SearchTime = [public_tbl_entry_queue].[search_time], tbl_Entry.FaultHE = [public_tbl_entry_queue].[fault_count], tbl_Entry.result_text = [public_tbl_entry_queue].[result_text] " & _
                   "WHERE (((tbl_Entry.classID_FK)=" & iClassID & ") AND mobile_app_lic_key = '" & strMobileAppLicKey & "' AND ((tbl_Entry.Qualified)=False) AND ((tbl_Entry.NQ)=False) AND ((tbl_Entry.Excused)=False) AND ((tbl_Entry.Absent)=False) AND ((tbl_Entry.Disqualified)=False));"
          'Debug.Print strSQL
45170     db.Execute strSQL
          
45180     strSQL = "SELECT tbl_Entry.entryID, tbl_Entry.classID_FK, tbl_Show.MobileAppLicKeyStatus, tbl_Entry.result_text, tbl_Entry.Qualified, tbl_Entry.NQ, tbl_Entry.Excused, tbl_Entry.Absent, tbl_Entry.Disqualified " & _
                   "FROM tbl_Show INNER JOIN tbl_Entry ON tbl_Show.showID = tbl_Entry.showID_FK " & _
                   "WHERE tbl_Entry.classID_FK = " & iClassID & " AND tbl_Show.MobileAppLicKey = '" & strMobileAppLicKey & "' AND tbl_Entry.result_text Is Not Null AND tbl_Entry.Qualified = False AND tbl_Entry.NQ = False AND tbl_Entry.Excused = False AND tbl_Entry.Absent = False  AND tbl_Entry.Disqualified = False;"
          'Debug.Print strSQL
45190     Set rs = db.OpenRecordset(strSQL)
            
45200     If Not rs.BOF And Not rs.EOF Then
45210         rs.MoveLast
45220         rs.MoveFirst
45230         iCount = rs.RecordCount
45240         strSQL = ""

              'Loop and update entries
45250         For i = 1 To iCount
45260             iEntryID = rs!entryID
                  'Debug.Print iEntryID & " - " & rs!result_text
                  
45270             If rs!result_text = "Qualified" Then
45280                 strSQL = "UPDATE tbl_Entry SET tbl_Entry.Qualified = True WHERE tbl_Entry.entryID = " & iEntryID & ";"
45290             ElseIf rs!result_text = "NQ" Then
45300                 strSQL = "UPDATE tbl_Entry SET tbl_Entry.NQ = True WHERE tbl_Entry.entryID = " & iEntryID & ";"
45310             ElseIf rs!result_text = "Absent" Then
45320                 strSQL = "UPDATE tbl_Entry SET tbl_Entry.Absent = True WHERE tbl_Entry.entryID = " & iEntryID & ";"
45330             ElseIf rs!result_text = "EX" Then
45340                 strSQL = "UPDATE tbl_Entry SET tbl_Entry.Excused = True WHERE tbl_Entry.entryID = " & iEntryID & ";"
45350             ElseIf rs!result_text = "DQ" Then
45360                 strSQL = "UPDATE tbl_Entry SET tbl_Entry.Disqualified = True WHERE tbl_Entry.entryID = " & iEntryID & ";"
45370             End If

45380             If strSQL <> "" Then
45390               db.Execute strSQL
45400             End If
                  
45410             rs.MoveNext
45420         Next
45430     End If
            
          'Calculate Placements
45440     Call Class_Placements
          
45450     DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo
45460     Forms!frm_Class_Main.Refresh
45470     MsgBox "Only entries with no results will be updated. " & vbCr & vbCr & iEntries & " entries in the class and " & iCount & " entries updated." & vbCr & vbCr & "You may need to refresh the class page.", vbInformation, "Download Complete"

End Sub

Public Sub myK9Q_Upload()

          'On Error GoTo fError
45480 On Error Resume Next

          'Export for Adding myK9Q Entries
          Dim iShowID As Integer
          Dim iTrialID As Integer
          Dim strSQL As String
          Dim strmyK9Q As String
          Dim strClubname As String
          Dim intCount As Long
          
          Dim db As DAO.Database
          Dim rs As DAO.Recordset
          Dim i As Long
          Dim api_url As String
          Dim strLicenseStatus
          Dim iEntries As Integer
          Dim iClubID As Integer
          Dim iEntryID As Integer
                   
          'Link myK9Q Tables
45490     Call LinkPostgres
          
45500     iShowID = Forms!frm_Trial.txtShowID
45510     iTrialID = Forms!frm_Trial.txtTrialID
45520     TempVars.Add "tmpmyK9QClassID", [TempVars]![tmpClassID].value
          
45530     iClubID = DLookup("ClubID_FK", "tbl_Show", "ShowID = " & iShowID)

45540     strmyK9Q = Nz(DLookup("MobileAppLicKeyStatus", "tbl_Show", "showID = " & iShowID), 0)

          'Check if Valid License
45550     If InStr(1, strmyK9Q, "Active and Valid") Then

45560             strClubname = DLookup("ClubName", "tbl_Club", "ClubID = " & iClubID)
45570             intCount = 1
45580             i = 1
          
                  'Progress Bar
45590             DoCmd.OpenForm "frm_Progress_myK9Q", acNormal
45600             Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Verifying License Key for Club ID: " & iClubID
                
45610             Call myK9Q_License_Status(iShowID, strClubname)
45620             intCount = DCount("entryID", "tbl_Entry", "TrialID_FK = " & iTrialID)

45630     Else
45640         MsgBox "Unable to Upload data without a Valid myK9Q License Key. Check myK9Q License Key and Status and Retry.", vbInformation, "myK9Q License Key"
45650         Exit Sub
45660     End If
              
              
          'Append myK9Q tables
45670     strLicenseStatus = DLookup("MobileAppLicKeyStatus", "tbl_Show", "showID = " & iShowID)
          
45680     If InStr(1, strLicenseStatus, "Active and Valid") Then

45690       Set db = CurrentDb

            'Debug.Print TempVars.tmpCalledFrom.value
              
            'Insert Trials
45700       Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Trial ID: " & iTrialID
45710       Forms!frm_Progress_myK9Q.Repaint

45720       DoCmd.SetWarnings False

45730       strSQL = "INSERT INTO public_tbl_show_queue ( clubname, mobile_app_lic_key, startdate, enddate, showid, showname, org, eventurl ) " & _
                         "SELECT qry_myK9Q_tbl_show_queue.ClubName, qry_myK9Q_tbl_show_queue.MobileAppLicKey, qry_myK9Q_tbl_show_queue.startdate, qry_myK9Q_tbl_show_queue.enddate, qry_myK9Q_tbl_show_queue.showid, qry_myK9Q_tbl_show_queue.showname, 'UKC Nosework', qry_myK9Q_tbl_show_queue.eventurl " & _
                         "FROM qry_myK9Q_tbl_show_queue LEFT JOIN public_tbl_show_queue ON (qry_myK9Q_tbl_show_queue.showid = public_tbl_show_queue.showid) AND (qry_myK9Q_tbl_show_queue.MobileAppLicKey = public_tbl_show_queue.mobile_app_lic_key) " & _
                         "WHERE (((public_tbl_show_queue.showid) Is Null));"
                         
45740           DoCmd.RunSQL strSQL
              
45750       If TempVars!tmpCalledFrom.value = "Class" Then
45760           strSQL = "INSERT INTO public_tbl_trial_queue ( clubname, mobile_app_lic_key, trial_date, trial_number, trialID, org ) " & _
                         "SELECT qry_myK9Q_tbl_trial_queue_class.ClubName, qry_myK9Q_tbl_trial_queue_class.MobileAppLicKey, qry_myK9Q_tbl_trial_queue_class.trial_long_date, qry_myK9Q_tbl_trial_queue_class.TrialNumber, qry_myK9Q_tbl_trial_queue_class.trialID, 'UKC Nosework' " & _
                         "FROM qry_myK9Q_tbl_trial_queue_class LEFT JOIN public_tbl_trial_queue ON (qry_myK9Q_tbl_trial_queue_class.trialID = public_tbl_trial_queue.trialid) AND (qry_myK9Q_tbl_trial_queue_class.MobileAppLicKey = public_tbl_trial_queue.mobile_app_lic_key) " & _
                         "WHERE (((public_tbl_trial_queue.trialid) Is Null)) " & _
                         "ORDER BY qry_myK9Q_tbl_trial_queue_class.trialID;"
45770       Else
45780           strSQL = "INSERT INTO public_tbl_trial_queue ( clubname, mobile_app_lic_key, trial_date, trial_number, trialID, org ) " & _
                         "SELECT qry_myK9Q_tbl_trial_queue_trial.ClubName, qry_myK9Q_tbl_trial_queue_trial.MobileAppLicKey, qry_myK9Q_tbl_trial_queue_trial.trial_long_date, qry_myK9Q_tbl_trial_queue_trial.TrialNumber, qry_myK9Q_tbl_trial_queue_trial.trialID, 'UKC Nosework' " & _
                         "FROM qry_myK9Q_tbl_trial_queue_trial LEFT JOIN public_tbl_trial_queue ON (qry_myK9Q_tbl_trial_queue_trial.trialID = public_tbl_trial_queue.trialid) AND (qry_myK9Q_tbl_trial_queue_trial.MobileAppLicKey = public_tbl_trial_queue.mobile_app_lic_key) " & _
                         "WHERE (((public_tbl_trial_queue.trialid) Is Null)) " & _
                         "ORDER BY qry_myK9Q_tbl_trial_queue_trial.trialID;"
45790       End If
                     
            'Debug.Print strSQL
45800       DoCmd.RunSQL strSQL


            'Insert Classes
45810       Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading Classes for Trial ID: " & iTrialID
45820       Forms!frm_Progress_myK9Q.Repaint
                     
45830       If TempVars!tmpCalledFrom = "Class" Then
45840           strSQL = "INSERT INTO public_tbl_class_queue ( mobile_app_lic_key, class_order, classID, TrialID_FK, trial_date, trial_number, Element, [Level], [Section], judge_name, time_limit) " & _
                         "SELECT qry_myK9Q_tbl_class_queue_class.MobileAppLicKey, qry_myK9Q_tbl_class_queue_class.ClassOrder, qry_myK9Q_tbl_class_queue_class.classID, qry_myK9Q_tbl_class_queue_class.TrialID_FK, qry_myK9Q_tbl_class_queue_class.trial_long_date, qry_myK9Q_tbl_class_queue_class.TrialNumber, qry_myK9Q_tbl_class_queue_class.Element, qry_myK9Q_tbl_class_queue_class.Level, qry_myK9Q_tbl_class_queue_class.Division, qry_myK9Q_tbl_class_queue_class.judge_name, qry_myK9Q_tbl_class_queue_class.Time_Limit " & _
                         "FROM qry_myK9Q_tbl_class_queue_class LEFT JOIN public_tbl_class_queue ON (qry_myK9Q_tbl_class_queue_class.MobileAppLicKey = public_tbl_class_queue.mobile_app_lic_key) AND (qry_myK9Q_tbl_class_queue_class.classID = public_tbl_class_queue.classid) " & _
                         "WHERE (((public_tbl_class_queue.classid) Is Null)) " & _
                         "ORDER BY qry_myK9Q_tbl_class_queue_class.classID;"
45850       Else
45860           strSQL = "INSERT INTO public_tbl_class_queue ( mobile_app_lic_key, class_order, classID, TrialID_FK, trial_date, trial_number, Element, [Level], [Section], judge_name, time_limit) " & _
                         "SELECT qry_myK9Q_tbl_class_queue_trial.MobileAppLicKey, qry_myK9Q_tbl_class_queue_trial.ClassOrder, qry_myK9Q_tbl_class_queue_trial.classID, qry_myK9Q_tbl_class_queue_trial.TrialID_FK, qry_myK9Q_tbl_class_queue_trial.trial_long_date, qry_myK9Q_tbl_class_queue_trial.TrialNumber, qry_myK9Q_tbl_class_queue_trial.Element, qry_myK9Q_tbl_class_queue_trial.Level, qry_myK9Q_tbl_class_queue_trial.Division, qry_myK9Q_tbl_class_queue_trial.judge_name, qry_myK9Q_tbl_class_queue_trial.Time_Limit " & _
                         "FROM qry_myK9Q_tbl_class_queue_trial LEFT JOIN public_tbl_class_queue ON (qry_myK9Q_tbl_class_queue_trial.MobileAppLicKey = public_tbl_class_queue.mobile_app_lic_key) AND (qry_myK9Q_tbl_class_queue_trial.classID = public_tbl_class_queue.classid) " & _
                         "WHERE (((public_tbl_class_queue.classid) Is Null)) " & _
                         "ORDER BY qry_myK9Q_tbl_class_queue_trial.classID;"
45870       End If

            'Debug.Print strSQL
45880       DoCmd.RunSQL strSQL
            
            'Insert Entries
45890       iEntries = DCount("entryID", "tbl_Entry", "classID_FK = " & [TempVars]![tmpmyK9QClassID].value)
45900       Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading " & iEntries & " Entries for Class ID: " & [TempVars]![tmpmyK9QClassID].value
45910       Forms!frm_Progress_myK9Q.Repaint
                     
45920       If TempVars!tmpCalledFrom = "Class" Then
45930           strSQL = "INSERT INTO public_tbl_entry_queue ( mobile_app_lic_key, entryID, TrialID_FK, classID_FK, trial_date, trial_number, Element, [Level], [Section], exhibitor_order, Armband, Exclude, call_name, breed, handler ) " & _
                         "SELECT qry_myK9Q_tbl_entry_queue_class.MobileAppLicKey, qry_myK9Q_tbl_entry_queue_class.entryID, qry_myK9Q_tbl_entry_queue_class.TrialID_FK, qry_myK9Q_tbl_entry_queue_class.classID_FK, qry_myK9Q_tbl_entry_queue_class.trial_long_date, qry_myK9Q_tbl_entry_queue_class.TrialNumber, qry_myK9Q_tbl_entry_queue_class.Element, qry_myK9Q_tbl_entry_queue_class.Level, qry_myK9Q_tbl_entry_queue_class.Division, qry_myK9Q_tbl_entry_queue_class.ExhibitorRunOrder, qry_myK9Q_tbl_entry_queue_class.Armband, qry_myK9Q_tbl_entry_queue_class.Exclude, qry_myK9Q_tbl_entry_queue_class.CallName, qry_myK9Q_tbl_entry_queue_class.BreedName, qry_myK9Q_tbl_entry_queue_class.HandlerName " & _
                         "FROM qry_myK9Q_tbl_entry_queue_class LEFT JOIN public_tbl_entry_queue ON (qry_myK9Q_tbl_entry_queue_class.entryID = public_tbl_entry_queue.entryid) AND (qry_myK9Q_tbl_entry_queue_class.MobileAppLicKey = public_tbl_entry_queue.mobile_app_lic_key) " & _
                         "WHERE (((public_tbl_entry_queue.entryID) Is Null)) " & _
                         "ORDER BY qry_myK9Q_tbl_entry_queue_class.Armband;"
                         
                'Debug.Print strSQL
                         
45940           DoCmd.RunSQL strSQL
45950       Else
            
45960           strSQL = "SELECT tbl_Class.TrialID_FK, tbl_Class.classID FROM tbl_Class WHERE tbl_Class.TrialID_FK = " & iTrialID & " ORDER BY tbl_Class.classID;"
                
                'Debug.Print strSQL
                            
45970           Set rs = db.OpenRecordset(strSQL)
              
45980           If Not rs.BOF And Not rs.EOF Then
45990               rs.MoveLast
46000               rs.MoveFirst
46010               intCount = rs.RecordCount
                
46020               For i = 1 To intCount
46030                   TempVars.Add "tmpmyK9QClassID", rs!classID.value
                        'Debug.Print i & " - " & TempVars!tmpmyK9QClassID
                        
46040                   iEntries = DCount("entryID", "tbl_Entry", "classID_FK = " & [TempVars]![tmpmyK9QClassID].value)
46050                   Forms!frm_Progress_myK9Q.lblCurrentTask.Caption = "Uploading " & iEntries & " Entries for Class ID: " & [TempVars]![tmpmyK9QClassID].value
46060                   Forms!frm_Progress_myK9Q.Repaint
                        
46070                   strSQL = "INSERT INTO public_tbl_entry_queue ( mobile_app_lic_key, entryID, TrialID_FK, classID_FK, trial_date, trial_number, Element, [Level], [Section], exhibitor_order, Armband, Exclude, call_name, breed, handler ) " & _
                                 "SELECT qry_myK9Q_tbl_entry_queue_class.MobileAppLicKey, qry_myK9Q_tbl_entry_queue_class.entryID, qry_myK9Q_tbl_entry_queue_class.TrialID_FK, qry_myK9Q_tbl_entry_queue_class.classID_FK, qry_myK9Q_tbl_entry_queue_class.trial_long_date, qry_myK9Q_tbl_entry_queue_class.TrialNumber, qry_myK9Q_tbl_entry_queue_class.Element, qry_myK9Q_tbl_entry_queue_class.Level, qry_myK9Q_tbl_entry_queue_class.Division, qry_myK9Q_tbl_entry_queue_class.ExhibitorRunOrder, qry_myK9Q_tbl_entry_queue_class.Armband, qry_myK9Q_tbl_entry_queue_class.Exclude, qry_myK9Q_tbl_entry_queue_class.CallName, qry_myK9Q_tbl_entry_queue_class.BreedName, qry_myK9Q_tbl_entry_queue_class.HandlerName " & _
                                 "FROM qry_myK9Q_tbl_entry_queue_class LEFT JOIN public_tbl_entry_queue ON (qry_myK9Q_tbl_entry_queue_class.entryID = public_tbl_entry_queue.entryid) AND (qry_myK9Q_tbl_entry_queue_class.MobileAppLicKey = public_tbl_entry_queue.mobile_app_lic_key) " & _
                                 "WHERE (((public_tbl_entry_queue.entryID) Is Null)) " & _
                                 "ORDER BY qry_myK9Q_tbl_entry_queue_class.Armband;"
                    
                        'Debug.Print strSQL
                        
46080                   DoCmd.RunSQL strSQL
46090                   rs.MoveNext
46100               Next
46110           End If
46120       End If
            
            'Remove Deleted Entries for example Move Ups
46130       strSQL = "SELECT tbl_Deleted_Entry_Temp.MobileAppLicKey, tbl_Deleted_Entry_Temp.entryID, tbl_Deleted_Entry_Temp.showID " & _
                     "FROM tbl_Deleted_Entry_Temp " & _
                     "WHERE tbl_Deleted_Entry_Temp.showID = " & iShowID & ";"
            
46140       Set rs = db.OpenRecordset(strSQL)
              
46150       If Not rs.BOF And Not rs.EOF Then
46160           rs.MoveLast
46170           rs.MoveFirst
46180           intCount = rs.RecordCount

                'Loop and delete entries
46190           For i = 1 To intCount
46200               iEntryID = rs!entryID
                    'Debug.Print iEntryID
46210               strSQL = "DELETE public_tbl_entry_queue.entryID FROM public_tbl_entry_queue WHERE entryID = " & iEntryID & ";"
46220                DoCmd.RunSQL strSQL
46230               rs.MoveNext
46240           Next
46250       End If

            'Close Progress
46260       DoCmd.Close acForm, "frm_Progress_myK9Q", acSaveNo

46270       MsgBox "myK9Q Upload for Trial ID " & iTrialID & " Complete", vbInformation, "myK9Q Upload Complete"
46280       DoCmd.SetWarnings True
                  
            'Cleanup
            'db.QueryDefs.Delete "tmpExport"
46290       db.Close
46300       Set db = Nothing
            'Set qd = Nothing
            'Set fd = Nothing
46310   Else
46320       MsgBox "License Key is not Active or Invalid", vbInformation, "License Key"
46330   End If



fError_Exit:
46340     On Error Resume Next
46350     Exit Sub

fError:
      'Debug.Print Err.Number
46360     Select Case Err.Number

             Case 2501
                  'Do Nothing
                  
46370         Case 3155
                  'Do Nothing
                  
46380         Case Else
                  'MsgBox "Error: " & Err.Number & vbCrLf & Err.Description & vbCrLf & "Line: " & Erl, vbCritical, "Warning", Err.HelpFile, Err.HelpContext
46390     End Select

End Sub

