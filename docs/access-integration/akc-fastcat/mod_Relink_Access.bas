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
40990     On Error GoTo Error_Handler
          Dim dbLocal As DAO.Database
          Dim dbPersConn As DAO.Database
          Dim sInitPath As String
          Dim sNewBEFile As String
          Dim tdf As DAO.TableDef
          Dim strSQL As String
          Dim rs As DAO.Recordset

          'Read ini file?

41000     Set dbLocal = CurrentDb

          'Generate list of BE Srcs
41010     Call ListBESources
          'Loop through each be src
41020     For Each BE In collBETablesSrcs
            'Debug.Print "Processing BE '" & BE & "'"
41030         If bForceRelink = True Then GoTo ForceRelink
41040         If FileExist(BE) And bForceRelink = False Then GoTo SkipBE    'BE can be located so no need to relink it
41050       Debug.Print , "Relinking in progress..."

41060         If FolderExist(GetFilePath(BE)) = True Then    'check and see if the path exists at all as a starting point to locate the file
41070             sInitPath = GetFilePath(BE)
41080         End If

ForceRelink:
41090         Call ListLinkedTablesForBESrc(BE)    'Gen a coll of all the tables for the given be src
              'Prompt the user for the new loaction of the BE file
              
              'If GetFileName(BE) = "postgres" Then GoTo SkipBE 'skip postgress tables
              
41100         sInitPath = BE
41110         sNewBEFile = fFileDialog(msoFileDialogFilePicker, "Please locate the " & GetFileName(BE) & " file.", sInitPath, , "MS Access,*.accdb")
41120         If sNewBEFile = "" Then
41130             MsgBox "Unable to relink the back-end source because you did not locate where the file is housed.", vbCritical Or vbOKOnly, "Exiting the database"
                  '140               Application.Quit
41140         Else
              
                  'Wrtie BE file Path to USysVersion table for About Box
41150             strSQL = "SELECT USysVersion.myShareFilePath, USysVersion.DataFilePath FROM USysVersion;"
41160             Set rs = dbLocal.OpenRecordset(strSQL)
41170             rs.Edit
41180             If InStr(1, sNewBEFile, "_data") Then
41190                 rs!DataFilePath = sNewBEFile
41200             ElseIf InStr(1, sNewBEFile, "Share") Then
41210                 rs!myShareFilePath = sNewBEFile
41220             End If
41230             rs.Update
41235             rs.Close
41236             Set rs = Nothing
                  
41240             If collBETablesSrcsPwds(BE) = "" Then
                      'No password
41250                 Set dbPersConn = OpenDatabase(sNewBEFile, False, False)
41260             Else
                      'Password protected
41270                 Set dbPersConn = OpenDatabase(sNewBEFile, False, False, ";pwd=" & collBETablesSrcsPwds(BE))   'Create persistent connection to the new BE
41280             End If
41290             For Each BETbl In collBELinkedTables
41300                 Debug.Print , "Processing table '" & BETbl & "'"
41310                 Set tdf = dbLocal.TableDefs(BETbl)
41320                 With tdf
41330                     .Connect = Replace(.Connect, BE, sNewBEFile)
41340                     .RefreshLink
41350                 End With
41360                 Set tdf = Nothing
41370             Next BETbl
41380             dbPersConn.Close
41390             Set dbPersConn = Nothing
41400         End If
41410         Debug.Print , "Relinking completed"

SkipBE:
41420     Next BE

Error_Handler_Exit:
41430     On Error Resume Next
41435     If Not rs Is Nothing Then
41436         rs.Close
41437         Set rs = Nothing
41438     End If
41440     Set tdf = Nothing
41450     If Not dbPersConn Is Nothing Then
41460         dbPersConn.Close
41470         Set dbPersConn = Nothing
41480     End If
41490     If Not dbLocal Is Nothing Then Set dbLocal = Nothing
41500     Exit Function

Error_Handler:
41510     MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
                 "Error Number: " & Err.Number & vbCrLf & _
                 "Error Source: " & sModName & "\RelinkTables" & vbCrLf & _
                 "Error Description: " & Err.Description & _
                 Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
                 , vbOKOnly + vbCritical, "An Error has Occured!"
41520     Resume Error_Handler_Exit
End Function

Public Sub ListBESources()
41530     On Error Resume Next
          'Dim db As DAO.Database
          Dim tdf As DAO.TableDef
          Dim strCon As String
          Dim sBackEnd As String
          Dim sPwd As String
          'Dim BE As Variant

41540     Set db = CurrentDb
41550     Set collBETablesSrcs = New Collection
41560     Set collBETablesSrcsPwds = New Collection

          'Loop through the TableDefs Collection.
41570     For Each tdf In db.TableDefs
              'Ensure the table is a linked table.
              '        If Left$(tdf.Connect, 10) = ";DATABASE=" Then
41580         If tdf.Connect Like "*;DATABASE=*" Then
                  'Get the path/filename of the linked back-end
41590             sBackEnd = Split(Split(tdf.Connect, "Database=")(1), ";")(0)    'Mid(tdf.Connect, 11)
41600             If sBackEnd <> "postgres" Then
41610                 If InStr(tdf.Connect, "pwd=") > 0 Then
41620                     sPwd = Split(Split(tdf.Connect, "pwd=")(1), ";")(0)
41630                 End If
                      'Ensure we have a valid string to add to our collection
41640                 If Len(sBackEnd & "") > 0 Then
41650                     collBETablesSrcs.Add item:=sBackEnd, Key:=sBackEnd
41660                     collBETablesSrcsPwds.Add item:=sPwd, Key:=sBackEnd
41670                 End If
41680             End If
41690         End If
41700     Next tdf

41710     Set tdf = Nothing
41720     Set db = Nothing
          '
          '    On Error GoTo 0
              'Debug.Print collBETablesSrcs.Count & " Data Source(s) found:"
          '    For Each BE In collBETablesSrcs
                  'Debug.Print BE
          '    Next BE
End Sub

Public Sub ListLinkedTables()
41730 On Error GoTo Error_Handler
    'Dim db As DAO.Database
    Dim tdf As DAO.TableDef

41740 DoCmd.SetWarnings False
41750 Set db = CurrentDb()
41760 Set collLinkedTables = New Collection

41770 For Each tdf In db.TableDefs
41780   If (tdf.Attributes And dbAttachedTable) = dbAttachedTable Then
41790       collLinkedTables.Add item:=tdf.Name, Key:=tdf.Name
41800   End If
41810 Next

Error_Handler_Exit:
41820 On Error Resume Next
41830 Set tdf = Nothing
41840 Set db = Nothing
41850 DoCmd.SetWarnings True
41860 Exit Sub

Error_Handler:
41870 MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
           "Error Number: " & Err.Number & vbCrLf & _
           "Error Source: " & sModName & "\ListLinkedTables" & vbCrLf & _
           "Error Description: " & Err.Description & _
           Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
           , vbOKOnly + vbCritical, "An Error has Occured!"
41880 Resume Error_Handler_Exit
End Sub

Public Sub ListLinkedTablesForBESrc(ByVal sBESrc As String)
41890 On Error GoTo Error_Handler
          'Dim db As DAO.Database
          Dim tdf As DAO.TableDef

41900 DoCmd.SetWarnings False
41910 Set db = CurrentDb()
41920 Set collBELinkedTables = New Collection

41930 For Each tdf In db.TableDefs
41940   If (tdf.Attributes And dbAttachedTable) = dbAttachedTable And tdf.Connect Like "*" & sBESrc & "*" Then
41950       collBELinkedTables.Add item:=tdf.Name, Key:=tdf.Name
41960   End If
41970 Next

Error_Handler_Exit:
41980 On Error Resume Next
41990 Set tdf = Nothing
42000 Set db = Nothing
42010 DoCmd.SetWarnings True
42020 Exit Sub

Error_Handler:
42030 MsgBox "The following error has occured" & vbCrLf & vbCrLf & _
           "Error Number: " & Err.Number & vbCrLf & _
           "Error Source: " & sModName & "\ListLinkedTablesForBESrc" & vbCrLf & _
           "Error Description: " & Err.Description & _
           Switch(Erl = 0, "", Erl <> 0, vbCrLf & "Line No: " & Erl) _
           , vbOKOnly + vbCritical, "An Error has Occured!"
42040 Resume Error_Handler_Exit
End Sub

Public Sub Refresh_Links()
          Dim db As DAO.Database
          Dim tdf As DAO.TableDef

42050 Set db = CurrentDb

42060 For Each tdf In db.TableDefs
42070     If tdf.Connect Like ";DATABASE*" Then
42080         tdf.RefreshLink
42090     End If
42100 Next tdf

42110     Set tdf = Nothing
42120     Set db = Nothing

End Sub
