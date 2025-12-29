' Script name: AutoGain
' 
' It monitors the input which has AutoGain in the name
' and automatically adjusts the gain to prevent clipping or low volume.
' You can configure the clip and peak threshold values bellow.
'
' Decibels = 20 * Math.Log10(Amplitude)

Dim timestamp As String = DateTime.Now.ToString("HH:mm:ss")
Console.WriteLine(timestamp & " AutoGain 1.0.0")

' ===== Configurations =====
Dim LOOP_TIME = 50  ' Wait time between each loop iteration

Dim CLIP_THRESHOLD As Double = 0.9  ' 0.9 ~ -1dB; meterF1 value to consider as clipping
Dim GAIN_DOWN_TIME As Integer = 1000  ' Minimum time between gain decreases

Dim PEAK_THRESHOLD As Double = 0.45  ' 0.45 ~ -7dB; meterF1 value to consider as a loud enough
Dim PEAK_WAIT As Integer = 5000  ' Time to wait after last peak detected before allowing gain increase
Dim GAIN_UP_TIME As Integer = 3000  ' Minimum time between gain increases

Dim VOICE_THRESHOLD As Double = 0.1  ' 0.1 ~ -20dB; meterF1 value to consider as voice present
Dim VOICE_DURATION As Integer = 250  ' Time of continuous voice detection to consider as speaking
Dim VOICE_WAIT As Integer = 5000  ' If there is no voice for this time, script stops adjusting gain

' ====== Timestamps ======
Dim now As Double = 0
Dim peakTimestamp As Double = 0  ' When translator last reached PEAK_THRESHOLD
Dim voiceThresholdTimestamp As Double = 0  ' When translator made sound above VOICE_THRESHOLD
Dim voiceTimestamp As Double = 0  ' When translator continuously spoke above VOICE_THRESHOLD for VOICE_DURATION
Dim gainDownTimestamp As Double = 0  ' When gain was last decreased
Dim gainUpTimestamp As Double = 0  ' When gain was last increased

Dim xml = New System.Xml.XmlDocument()

Do While True
    Sleep(LOOP_TIME)

    Try
        ' Load vMix XML
        xml.LoadXml(API.XML())
        now = (DateTime.Now - New DateTime(2000,1,1)).TotalMilliseconds

        ' Get Translator mic input node
        Dim micNode = xml.SelectSingleNode("//input[contains(@title, 'AutoGain')]")
        If micNode Is Nothing Then
            Console.WriteLine(timestamp & " AutoGain | No inputs have 'AutoGain' in the name.")
            Sleep(5000)
            Continue Do
        End If

        If micNode.Attributes("muted").Value = "True" Then
            ' Skip if muted
            voiceThresholdTimestamp = 0
            Continue Do
        End If

        Dim meterF1 As Double = CDbl(micNode.Attributes("meterF1").Value)
        Dim inputNumber As String = micNode.Attributes("number").Value
        Dim gainDb As Integer = CInt(micNode.Attributes("gainDb").Value)

        If meterF1 > PEAK_THRESHOLD Then
            peakTimestamp = now
        End If

        ' Detect voice only when it is present for a duration
        ' to avoid false positives from short noises
        If meterF1 > VOICE_THRESHOLD Then
            If voiceThresholdTimestamp = 0 Then
                voiceThresholdTimestamp = now
            ElseIf now - voiceThresholdTimestamp > VOICE_DURATION Then
                voiceTimestamp = now
            End If
        Else
            voiceThresholdTimestamp = 0
        End If

        If now - voiceTimestamp > VOICE_WAIT Then
            ' No voice detected for a while, skip gain adjustments
            Continue Do
        End If

        If now - peakTimestamp > PEAK_WAIT And now - gainUpTimestamp > GAIN_UP_TIME Then
            ' Increase gain if no peaks detected for GAIN_UP_TIME
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Min(gainDb + 1, 24)))
            gainUpTimestamp = now
        End If

        If meterF1 > CLIP_THRESHOLD And now - gainDownTimestamp > GAIN_DOWN_TIME Then
            ' Decrease gain to prevent clipping
            API.Function("SetGain", Input:=inputNumber, Value:=CStr(Math.Max(gainDb - 1, 0)))
            gainDownTimestamp = now
        End If

    Catch ex As Exception
        timestamp = DateTime.Now.ToString("HH:mm:ss")
        Console.WriteLine(timestamp & " AutoGain | Unexpected error: " & ex.Message)
    End Try
Loop
