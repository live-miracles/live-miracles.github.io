' Script name: Slave
' When master switches to the input n, this script will
' cause the current vMix (slave) to follow and switch to input n.
' Update the master IP below:
Dim masterAPI = "http://192.168.x.x:8088/api"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Slave 1.0.5")

Dim loopTime = 300
Dim transitionBuffer = 3000

Dim localXml As New System.Xml.XmlDocument()
Dim localResponse As String
Dim localActive
Dim localPreview

Dim http As New System.Net.WebClient()
Dim responseText As String
Dim masterXml As New System.Xml.XmlDocument()
Dim masterActive
Dim masterPreview

If masterAPI = "http://192.168.x.x:8088/api" Then
    Console.WriteLine(timestamp & " Slave | Please update the masterAPI " & masterAPI & ". Exiting...")
    Return
End If

Do While True
    Sleep(loopTime)

    Try
        localResponse = API.XML()
        localXml.LoadXml(localResponse)
        localActive = localXml.SelectSingleNode("//active").InnerText
        localPreview = localXml.SelectSingleNode("//preview").InnerText

        responseText = http.DownloadString(masterAPI)
        masterXml.LoadXml(responseText)
        masterActive = masterXml.SelectSingleNode("//active").InnerText
        masterPreview = masterXml.SelectSingleNode("//preview").InnerText

        If masterActive <> localActive Then
            API.Function("Stinger1", masterActive)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New active: " & masterActive)
            Sleep(transitionBuffer)
        End If

        If masterPreview <> localPreview Then
            API.Function("PreviewInput", masterPreview)
            timestamp = DateTime.Now.ToString("HH:mm:ss")
            Console.WriteLine(timestamp & " Slave | New preview: " & masterPreview)
        End If
    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Slave | Unexpected error: " & ex.Message)
    End Try
Loop
