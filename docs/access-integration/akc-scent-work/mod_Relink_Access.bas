Attribute VB_Name = "mod_Relink_Access"
'***************************************************************************************
' Module    : mod_DB_Tables_Relinker
' Author    : CARDA Consultants Inc.
' Website   : http://www.cardaconsultants.com
' Copyright : Please note that U.O.S. all the content herein considered to be
'             intellectual property (copyrighted material).
'             It may not be copied, reused or modified in any way without prior
'             authorization from its author(s).
'***************************************************************************************

Option Compare Database
Option Explicit

Private Const sModName = "mod_Relink_Access"
Public collBETablesSrcs       As Collection
Public collBETablesSrcsPwds   As Collection
Public collLinkedTables       As Collection
Public collBELinkedTables     As Collection
Private BE                    As Variant
Private BETbl                 As Variant
Private db                    As DAO.Database


Public Function RelinkTables(Optional bForceRelink As Boolean = False)
47050     On Error GoTo Error_Handler
          Dim dbLocal               As DAO.Database
          Dim dbPersConn            As DAO.Database
          Dim sInitPath             As String
          Dim sNewBEFile            As String
          Dim tdf                   As DAO.TableDef
          Dim strSQL                As String
          Dim rs                    As DAO.Recordset

          'Read ini file?

47060     Set dbLocal = CurrentDb

          'Generate list of BE Srcs
47070     Call ListBESources
          'Loop through each be src
47080     For Each BE In collBETablesSrcs
            'Debug.Print "Processing BE '" & BE & "'"
47090         If bForceRelink = True Then GoTo ForceRelink
47100         If FileExist(BE) And bForceRelink = False Then GoTo SkipBE    'BE can be located so no need to relink it
            'Debug.Print , "Relinking in progress..."

47110         If FolderExist(GetFilePath(BE)) = True Then    'check and see if the path exists at all as a starting point to locate the file
47120             sInitPath = GetFilePath(BE)
47130         End If

ForceRelink:
47140         Call ListLinkedTablesForBESrc(BE)    'Gen a coll of all the tables for the given be src
              'Prompt the user for the new loaction of the BE file
              
              'If GetFileName(BE) = "postgres" Then GoTo SkipBE 'skip postgress tables
              
47150         sInitPath = BE
47160         sNewBEFile = fFileDialog(msoFileDialogFilePicker, "Please locate the " & GetFileName(BE) & " file.", sInitPath, , "MS Access,*.accdb")
47170         If sNewBEFile = "" Then
47180             MsgBox "Unable to relink the back-end source because you did not locate where the file is housed.", vbCritical Or vbOKOnly, "Exiting the database"
                  '140               Application.Quit
47190         Else
              
                  'Wrtie BE file Path to USysVersion table for About Box
47200             strSQL = "SELECT USysVersion.myShareFilePath, USysVersion.DataFilePath FROM USysVersion;"
47210             Set rs = dbLocal.OpenRecordset(strSQL)
47220             rs.Edit
47230             If InStr(1, sNewBEFile, "_data") Then
47240                 rs!DataFilePath = sNewBEFile
47250             ElseIf InStr(1, sNewBEFile, "Share") Then
47260                 rs!myShareFilePath = sNewBEFile
47270             End If
47280             rs.Update
                  
47290             If collBETablesSrcsPwds(BE) = "" Then
                      'No password
47300                 Set dbPersConn = OpenDatabase(sNewBEFile, False, False)
47310             Else
                      'Password protected
47320                 Set dbPersConn = OpenDatabase(sNewBEFile, False, False, ";pwd=" & collBETablesSrcsPwds(BE))   'Create persistent connection to the new BE
47330             End If
47340             For Each BETbl In collBELinkedTables
                      'Debug.Print , "Processing table '" & BETbl & "'"
47350                 Set tdf = dbLocal.TableDefs(BETbl)
47360                 With tdf
47370                     .Connect = Replace(.Connect, BE, sNewBEFile)
47380                     .RefreshLink
47390                 End With
47400                 Set tdf = Nothing
47410             Next BETbl
47420             dbPersConn.Close
47430             Set dbPersConn = Nothing
47440         End If
              'Debug.Print , "Relinking completed"

SkipBE:
47450     Next BE

Error_Handler_Exit:
47460     On Error Resume Next
47470     Set tdf = Nothing
47480     If Not dbPersConn Is Nothing Then
47490         dbPersConn.Close
47500         Set dbPersConn = Nothing
47510     End If
47520     If Not dbLocal Is Nothing Then Set dbLocal = Nothing
47530     Exit Function

Error_Handler:
47540     MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
                 "Error Number: " & Err.Number & vbCrLf & _
                 "Error Source: " & sModName & "\RelinkTables" & vbCrLf & _
                 "Error Description: " & Err.Description & _
                 Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
                 , vbOKOnly + vbCritical, "An Error has Occured!"
47550     Resume Error_Handler_Exit
End Function

Public Sub ListBESources()
47560     On Error Resume Next
          '    Dim db                    As DAO.Database
          Dim tdf                   As DAO.TableDef
          Dim strCon                As String
          Dim sBackEnd              As String
          Dim sPwd                  As String
          '    Dim BE                    As Variant

47570     Set db = CurrentDb
47580     Set collBETablesSrcs = New Collection
47590     Set collBETablesSrcsPwds = New Collection

          'Loop through the TableDefs Collection.
47600     For Each tdf In db.TableDefs
              'Ensure the table is a linked table.
              '        If Left$(tdf.Connect, 10) = ";DATABASE=" Then
47610         If tdf.Connect Like "*;DATABASE=*" Then
                  'Get the path/filename of the linked back-end
47620             sBackEnd = Split(Split(tdf.Connect, "Database=")(1), ";")(0)    'Mid(tdf.Connect, 11)
47630             If sBackEnd <> "postgres" Then
47640                 If InStr(tdf.Connect, "pwd=") > 0 Then
47650                     sPwd = Split(Split(tdf.Connect, "pwd=")(1), ";")(0)
47660                 End If
                      'Ensure we have a valid string to add to our collection
47670                 If Len(sBackEnd & "") > 0 Then
47680                     collBETablesSrcs.Add item:=sBackEnd, key:=sBackEnd
47690                     collBETablesSrcsPwds.Add item:=sPwd, key:=sBackEnd
47700                 End If
47710             End If
47720         End If
47730     Next tdf

47740     Set tdf = Nothing
47750     Set db = Nothing
          '
          '    On Error GoTo 0
              'Debug.Print collBETablesSrcs.Count & " Data Source(s) found:"
          '    For Each BE In collBETablesSrcs
                  'Debug.Print BE
          '    Next BE
End Sub

Public Sub ListLinkedTables()
47760 On Error GoTo Error_Handler
          '    Dim db                    As DAO.Database
          Dim tdf                   As DAO.TableDef

47770 DoCmd.SetWarnings False
47780 Set db = CurrentDb()
47790 Set collLinkedTables = New Collection

47800 For Each tdf In db.TableDefs
47810   If (tdf.Attributes And dbAttachedTable) = dbAttachedTable Then
47820       collLinkedTables.Add item:=tdf.Name, key:=tdf.Name
47830   End If
47840 Next

Error_Handler_Exit:
47850 On Error Resume Next
47860 Set tdf = Nothing
47870 Set db = Nothing
47880 DoCmd.SetWarnings True
47890 Exit Sub

Error_Handler:
47900 MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
           "Error Number: " & Err.Number & vbCrLf & _
           "Error Source: " & sModName & "\ListLinkedTables" & vbCrLf & _
           "Error Description: " & Err.Description & _
           Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
           , vbOKOnly + vbCritical, "An Error has Occured!"
47910 Resume Error_Handler_Exit
End Sub

Public Sub ListLinkedTablesForBESrc(ByVal sBESrc As String)
47920 On Error GoTo Error_Handler
          '    Dim db                    As DAO.Database
          Dim tdf                   As DAO.TableDef

47930 DoCmd.SetWarnings False
47940 Set db = CurrentDb()
47950 Set collBELinkedTables = New Collection

47960 For Each tdf In db.TableDefs
47970   If (tdf.Attributes And dbAttachedTable) = dbAttachedTable And tdf.Connect Like "*" & sBESrc & "*" Then
47980       collBELinkedTables.Add item:=tdf.Name, key:=tdf.Name
47990   End If
48000 Next

Error_Handler_Exit:
48010 On Error Resume Next
48020 Set tdf = Nothing
48030 Set db = Nothing
48040 DoCmd.SetWarnings True
48050 Exit Sub

Error_Handler:
48060 MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
           "Error Number: " & Err.Number & vbCrLf & _
           "Error Source: " & sModName & "\ListLinkedTablesForBESrc" & vbCrLf & _
           "Error Description: " & Err.Description & _
           Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
           , vbOKOnly + vbCritical, "An Error has Occured!"
48070 Resume Error_Handler_Exit
End Sub

Public Sub Refresh_Links()
          Dim db As DAO.Database
          Dim tdf As DAO.TableDef

48080 Set db = CurrentDb

48090 For Each tdf In db.TableDefs
48100     If tdf.Connect Like ";DATABASE*" Then
48110         tdf.RefreshLink
48120     End If
48130 Next tdf

42140     Set tdf = Nothing
42150     Set db = Nothing

End Sub


