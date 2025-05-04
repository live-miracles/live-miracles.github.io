' Script name: DuratronTimer
' This script calculates the remaining time of the current input and
' updates this time in the GT input named "DurationTimer".
' If the current input has no duration, it will start counting up.
' Text input needs to be configured: Right click > Title Editor > Settings and
' - set Duration as "23:00:00"
' - select Display Format as "mm:ss"
' - turn on "Reverse"
' - turn on "Display 00:00:00 when Stopped"

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " DurationTimer 1.1.0")

Dim gtInputTitle = "DurationTimer"
Dim position As Double = 0
Dim duration As Double = 0
Dim yellowTime As Integer = 60
Dim redTime As Integer = 11

Dim xml As String = API.XML()
Dim x As New System.Xml.XmlDocument()
x.loadxml(xml)
Dim textNode As XmlNode = x.SelectSingleNode("//input[@title='" & gtInputTitle & "']")

If textNode Is Nothing Then
    timestamp = DateTime.Now.ToString("HH:mm:ss")
    Console.WriteLine(timestamp & " DuratronTimer | Could not find a GT input named '" & gtInputTitle & "'.")

    Dim firstTitle As String = Nothing
    Dim inputNodes As System.Xml.XmlNodeList = x.SelectNodes("//input")

    For Each inputNode As XmlNode In inputNodes
        Dim inputType As String = inputNode.Attributes("type").Value

        If inputType = "GT" Then
            firstTitle = inputNode.Attributes("title").Value
            API.Function("SetInputName", firstTitle, gtInputTitle)
            Console.WriteLine("Renamed the first found GT '"  & firstTitle & "' into '" & gtInputTitle & "'.")
            Exit For
        End If
    Next

    If firstTitle Is Nothing Then
        API.Function("AddInput", "", "Title|C:\Program Files (x86)\vMix\titles\GT Text\Text Middle Centre Outline.gtzip")
        API.Function("SetInputName", "Text Middle Centre Outline.gtzip", gtInputTitle)
        API.Function("MoveInput", gtInputTitle, "1")
        API.Function("SetZoom", gtInputTitle, "5")
        Console.WriteLine("Created a new GT input named '" & gtInputTitle & "'.")
    End If
End If

Dim lastActive As String = "0"
Dim currentActive As String = "0"
Do While True
    Sleep(500)

    Try
        xml = API.XML()
        x.loadxml(xml)

        Dim activeInput As String = (x.SelectSingleNode("//active").InnerText)
        Dim durationNode As XmlNode = x.SelectSingleNode("//input[@number='" & activeInput & "']/@duration")
        duration = Double.Parse(durationNode.Value)

        Dim positionNode As XmlNode = x.SelectSingleNode("//input[@number='"& activeInput &"']/@position")
        position = Double.Parse(positionNode.Value)

        If duration = 0
            API.Function("SetTextColour", gtInputTitle, "white")

            currentActive = x.SelectSingleNode("//active").InnerText
            If (lastActive <> currentActive) Then
                lastActive = currentActive
                API.Function("StopCountdown", gtInputTitle)
            End If
            API.Function("StartCountdown", gtInputTitle)
            Continue Do
        Else
            API.Function("StopCountdown", gtInputTitle)
        End If

        Dim timeLeft As Integer = CInt((duration - position) / 100)
        timeLeft = timeLeft / 10

        Dim hour As Integer = timeLeft \ 3600
        Dim min As Integer = timeLeft \ 60
        Dim sec As Integer = timeLeft Mod 60

        Dim timeStr As String = sec.ToString()
        If hour > 0
            timeStr = hour.ToString() & ":" & min.ToString("00") & ":" & sec.ToString("00")
        ElseIf min > 0
            timeStr = min.ToString() & ":" & sec.ToString("00")
        End If
        API.Function("SetText", gtInputTitle, timeStr)

        If timeLeft < redTime
            API.Function("SetTextColour", gtInputTitle, "red")
        ElseIf timeLeft < yellowTime
            API.Function("SetTextColour", gtInputTitle, "orange")
        Else
            API.Function("SetTextColour", gtInputTitle, "green")
        End If
    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " DuratronTimer | Unexpected error: " & ex.Message)
    End Try
Loop
