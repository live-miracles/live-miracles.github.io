' Script name: Translator
' This is a sidechain translator script, which monitors the mic/call input level
' and reduces the volume of the chain Bus when the translator is speaking.
' You can configure the fade times and treshhold values bellow.

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Translator 1.1.1")

' Configuration
Dim loopTime = 50
Dim voiceThreshold As Double = 0.05
Dim silenceLimit As Integer = 2500
Dim silenceLimit2 As Integer = 7000
Dim volumeFull = 75
Dim volumeFull2 = 85
Dim volumeReduced = 50
Dim volumeUpTime = 1000
Dim volumeUpTime2 = 3000
Dim volumeDownTime = 200
Dim chainBus = "B"

Dim xml = New System.Xml.XmlDocument()
Dim lastActiveTimetamp As DateTime = DateTime.Now
Dim fadeUpTimestamp As DateTime = DateTime.Now

Do While True
    Sleep(loopTime)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'Translator')]")

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='Audio']")
        End If

        If micNode Is Nothing Then
            micNode = xml.SelectSingleNode("//input[@type='VideoCall']")
        End If

        If micNode Is Nothing Then
            Console.WriteLine(timestamp & " Translator | No mic / vMix Call input detected.")
            Sleep(5000)
            Continue Do
        End If

        Dim micLevel As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim micMuted As String = micNode.Attributes("muted").Value

        ' --- Translator Speaking ---
        If micLevel > voiceThreshold And micMuted = "False" Then
            ' Reduce source volume
            lastActiveTimetamp = DateTime.Now
            API.Function("SetBus" & chainBus & "VolumeFade", Value:=(volumeReduced & "," & volumeDownTime))
            Sleep(volumeDownTime)

        Else
            ' --- Translator is silent ---
            Dim silenceDuration As Double = (DateTime.Now - lastActiveTimetamp).TotalMilliseconds
            Dim fadeDuration As Double = (DateTime.Now - fadeUpTimestamp).TotalMilliseconds

            If silenceDuration > silenceLimit2 Then
                IF fadeDuration > volumeUpTime2 Then
                    ' Raise source volume back to full
                    API.Function("SetBus" & chainBus & "VolumeFade", Value:=(volumeFull2 & "," & volumeUpTime2))
                    fadeUpTimestamp = DateTime.Now
                End If

            ElseIf silenceDuration > silenceLimit Then
                IF fadeDuration > volumeUpTime Then
                    ' Raise source volume back to full
                    API.Function("SetBus" & chainBus & "VolumeFade", Value:=(volumeFull & "," & volumeUpTime))
                    fadeUpTimestamp = DateTime.Now
                End If
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Translator | Unexpected error: " & ex.Message)
    End Try
Loop
