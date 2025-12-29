' Script name: AudioFade
' By default, when you transition from one input to another, the audio
' stops abruptly. This script makes the audio transition smooth.
' The script only applies to inputs with "AudioFade" in the title.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AudioFade 1.0.6")

Dim maxVolume = 91
Dim fadeDownTime = 3000
Dim fadeUpTime = 1000

Dim xml = New System.Xml.XmlDocument()
xml.LoadXml(API.XML())
Dim nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")
Dim inputNode As XmlNode
For Each inputNode In nodeList
    Dim inputNumber = inputNode.Attributes("number").Value
    API.Function("AudioAutoOff", inputNumber)
    API.Function("AutoPlayOn", inputNumber)
    API.Function("AutoRestartOff", inputNumber)
    API.Function("AutoPauseOff", inputNumber)
Next

Do While True
    Sleep(500)

    Try
        xml.LoadXml(API.XML())

        Dim activeNumber = xml.SelectSingleNode("//active").InnerText

        ' Find input with "AudioFade" in the title
        nodeList = xml.SelectNodes("//input[contains(@title, 'AudioFade')]")

        For Each inputNode In nodeList
            Dim isMuted = inputNode.Attributes("muted").Value
            Dim inputNumber = inputNode.Attributes("number").Value
            Dim isActive = (inputNumber = activeNumber)

            If isMuted = "False" And Not isActive Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                console.WriteLine(timestamp & " AudioFade | Fading volume for input " & inputNumber)
                API.Function("SetVolumeFade", inputNumber, "0," & fadeDownTime)
                Sleep(fadeDownTime)
                API.Function("AudioOff", inputNumber)
                API.Function("Pause", inputNumber)
                API.Function("SetPosition", inputNumber, "0")
            ElseIf isMuted = "True" And isActive Then
                timestamp = DateTime.Now.ToString("HH:mm:ss")
                console.WriteLine(timestamp & " AudioFade | Unmuting input " & inputNumber)
                API.Function("AudioOn", inputNumber)
                API.Function("SetVolumeFade", inputNumber, maxVolume & "," & fadeUpTime)
                Sleep(fadeUpTime)
            End If
        Next
    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AudioFade | Unexpected error: " & ex.Message)
    End Try
Loop
