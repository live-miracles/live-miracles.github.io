' Script name: Translator
'
' This is a sidechain translator script, which monitors the mic/call input level
' and reduces the volume of the chain Bus when the translator is speaking.
' You can configure the fade times and threshold values bellow.
'
' The script will automatically detect a mic or vMix Call, and you can also specify
' it manually by adding "Translator" keyword in the input title.
'
' The bellow configurations are good for a translation scenario when the translator is always speaking
' If there is music or other parts which should be in full volume you can adjust the settings accordingly:
' VOLUME_FULL2 = 100 (go to 100% volume if no translation for a while)
' Decibels = 20 * Math.Log10(Amplitude)
'
' Script will raise the volume in two stages to make it more smooth. All config time values are in ms.
'
' Source Volume (chain bus)
' |                         ●─────
' |                        /
' |                       /
' |                      /
' |                     /
' |                    /
' |                   /
' |           ●──────●
' |          /
' |●────────●
' +----+----+----+----+----+----+----→ Silence Time (no translation)

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " Translator 1.1.3")

' ===== Configurations =====
Dim LOOP_TIME = 50  ' Wait time between each loop iteration
Dim VOICE_THRESHOLD As Double = 0.1  ' 0.1 ~ -20dB; meterF1 value to consider as voice present
Dim CHAIN_BUS = "B"  ' Script will be adjusting volume for this bus

Dim VOLUME_DOWN_TIME = 350  ' How fast to fade volume down when translator starts speaking
Dim VOLUME_REDUCED = 50  ' Volume when translator is speaking

Dim SILENCE_LIMIT As Integer = 2000  ' If translator doesn't speak for this duration we will start raising volume
Dim VOLUME_UP_TIME = 1000  ' How fast to raise volume first time
Dim VOLUME_FULL = 75  ' How much to raise volume first time

Dim SILENCE_LIMIT2 As Integer = 4000  ' If translator still not speaking it will raise the volume even more
Dim VOLUME_UP_TIME2 = 2000  ' How fast to raise volume second time
Dim VOLUME_FULL2 = 85  ' How much to raise volume second time

' ====== Timestamps ======
Dim now As Double = 0
Dim lastActiveTimestamp As Double = 0  ' When translator last reached VOICE_THRESHOLD
Dim fadeUpTimestamp As Double = 0  ' When we started fading up volume
Dim fadeDownTimestamp As Double = 0  ' When we started fading down volume

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000,1,1)).TotalMilliseconds

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

        If micLevel > VOICE_THRESHOLD And micMuted = "False" Then
            ' --- Translator is speaking, reduce volume ---
            lastActiveTimestamp = now
            If now - fadeDownTimestamp > VOLUME_DOWN_TIME
                API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_REDUCED & "," & VOLUME_DOWN_TIME))
                fadeDownTimestamp = now
            End If

        Else
            ' --- Translator is silent, raise volume ---
            If now - lastActiveTimestamp > SILENCE_LIMIT2 Then
                IF now - fadeUpTimestamp > VOLUME_UP_TIME2 Then
                    API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_FULL2 & "," & VOLUME_UP_TIME2))
                    fadeUpTimestamp = now
                End If

            ElseIf now - lastActiveTimestamp > SILENCE_LIMIT Then
                IF now - fadeUpTimestamp > VOLUME_UP_TIME Then
                    API.Function("SetBus" & CHAIN_BUS & "VolumeFade", Value:=(VOLUME_FULL & "," & VOLUME_UP_TIME))
                    fadeUpTimestamp = now
                End If
            End If
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " Translator | Unexpected error: " & ex.Message)
    End Try
Loop
