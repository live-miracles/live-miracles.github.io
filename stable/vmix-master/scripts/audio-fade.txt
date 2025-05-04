' Script name: AudioFade
' By default, when you transition from one input to another, the audio
' stops abruptly. This script makes the audio transition smooth.
' The script only applies to inputs with "AudioFade" in the title.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AudioFade 1.0.4")

Dim maxVolume = "91"
Dim fadeDownTime = "3000"
Dim fadeUpTime = "1000"

Dim inputs = API.XML()
Dim xml = New System.Xml.XmlDocument()
xml.LoadXml(inputs)
Dim nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")
Dim inputNode As XmlNode
For Each inputNode In nodeList
    Dim inputNumber = inputNode.Attributes("number").Value
    API.Function("AutoPauseOff", inputNumber)
    API.Function("AutoPlayOff", inputNumber)
    API.Function("AudioAutoOff", inputNumber)
    API.Function("AutoRestartOff", inputNumber)
Next

Do While True
    Sleep(500)

    Try
        inputs = API.XML()
        xml = New System.Xml.XmlDocument()
        xml.LoadXml(inputs)
        
        ' Find input with "AudioFade" in the title
        nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")

        For Each inputNode In nodeList
            Dim inputNumber = inputNode.Attributes("number").Value
            Dim isRunning = inputNode.Attributes("state").Value
            
            ' Get the currently active input number
            Dim activeNode = xml.SelectSingleNode("//active")
            Dim activeNumber = activeNode.InnerText
            Dim isActive = (inputNumber = activeNumber)

            If isRunning = "Running" And Not isActive Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                console.WriteLine(timestamp & " AudioFade | Fading volume for input " & inputNumber)
                API.Function("SetVolumeFade", inputNumber, "0," & fadeDownTime)
                Sleep(3000)
                API.Function("AudioOff", inputNumber)
                API.Function("Pause", inputNumber)
                API.Function("SetPosition", inputNumber, "0")
            ElseIf isRunning = "Paused" And isActive Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                console.WriteLine(timestamp & " AudioFade | Restarting input " & inputNumber)
                API.Function("Restart", inputNumber)
                API.Function("Play", inputNumber)
                API.Function("AudioOn", inputNumber)
                API.Function("SetVolumeFade", inputNumber, maxVolume & "," & fadeUpTime)
            End If
        Next
    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AudioFade | Unexpected error: " & ex.Message)
    End Try
Loop
