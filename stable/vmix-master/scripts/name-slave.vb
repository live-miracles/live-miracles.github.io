' Script name: NameSlave
'
' When remote vMix switches to the input with name X, this script will
' cause the local vMix (slave) to follow and switch to input X.
' If no input with name X exists on the slave, it will switch to defaultInput.
'
' Update the master IP below:
Dim masterAPI = "http://192.168.x.x:8088/api"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " NameSlave 1.0.0")

Dim loopTime = 300
Dim transitionBuffer = 3000
Dim defaultInput = "1"

Dim http As New System.Net.WebClient()
Dim masterXml As New System.Xml.XmlDocument()
Dim localXml As New System.Xml.XmlDocument()

If masterAPI = "http://192.168.x.x:8088/api" Then
    Console.WriteLine(timestamp & " NameSlave | Please update the masterAPI " & masterAPI & ". Exiting...")
    Return
End If

Do While True
    Sleep(loopTime)

    Try
        masterXml.LoadXml(http.DownloadString(masterAPI))
        
        Dim masterActive = masterXml.SelectSingleNode("//active").InnerText
        Dim masterActiveTitle = masterXml.SelectSingleNode("//input[@number='" & masterActive & "']").Attributes("title").Value
        Dim correctActiveNode = localXml.SelectSingleNode("//input[@title='" & masterActiveTitle & "']")
        Dim correctActive = defaultInput
        If correctActiveNode IsNot Nothing Then
            correctActive = correctActiveNode.Attributes("number").Value
        End If

        Dim masterPreview = masterXml.SelectSingleNode("//preview").InnerText
        Dim masterPreviewTitle = masterXml.SelectSingleNode("//input[@number='" & masterPreview & "']").Attributes("title").Value
        Dim correctPreviewNode = localXml.SelectSingleNode("//input[@title='" & masterPreviewTitle & "']")
        Dim correctPreview = defaultInput
        If correctPreviewNode IsNot Nothing Then
            correctPreview = correctPreviewNode.Attributes("number").Value
        End If
        
        localXml.LoadXml(API.XML())
        Dim localActive = localXml.SelectSingleNode("//active").InnerText
        Dim localPreview = localXml.SelectSingleNode("//preview").InnerText

        If correctActive <> localActive Then
            API.Function("Stinger1", correctActive)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " NameSlave | New active: " & correctActive)
            Sleep(transitionBuffer)
        End If

        If correctPreview <> localPreview Then
            API.Function("PreviewInput", correctPreview)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " NameSlave | New preview: " & correctPreview)
        End If
    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " NameSlave | Unexpected error: " & ex.Message)
    End Try
Loop
