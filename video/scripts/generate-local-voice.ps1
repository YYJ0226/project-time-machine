param(
    [string]$Voice = 'Microsoft Yaoyao',
    [ValidateRange(-10, 10)][int]$Rate = 2,
    [ValidatePattern('^[a-z0-9-]+$')][string]$Take = 'offline-v1'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$videoRoot = Split-Path -Parent $PSScriptRoot
$narration = Get-Content -LiteralPath (Join-Path $videoRoot 'narration.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$audioRoot = Join-Path $videoRoot "public\audio\$Take"
if (Test-Path -LiteralPath $audioRoot) { throw 'Take already exists. Choose a new -Take; existing audio is never overwritten.' }
New-Item -ItemType Directory -Path $audioRoot | Out-Null
$entries = @()
try {
    for ($index = 0; $index -lt $narration.segments.Count; $index++) {
        $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
        try {
            $speaker.SelectVoice($Voice)
            $speaker.Rate = $Rate
            $fileName = 'phrase-{0:00}.wav' -f ($index + 1)
            $audioPath = Join-Path $audioRoot $fileName
            $speaker.SetOutputToWaveFile($audioPath)
            $speaker.Speak([string]$narration.segments[$index])
            $speaker.SetOutputToNull()
            $entries += [PSCustomObject]@{
                text = $narration.segments[$index]
                file = "audio/$Take/$fileName"
                sha256 = (Get-FileHash -LiteralPath $audioPath -Algorithm SHA256).Hash.ToLowerInvariant()
            }
        } finally { $speaker.Dispose() }
    }
    $metadata = [PSCustomObject]@{
        provider = 'Windows System.Speech offline synthesis'
        voice = $Voice
        rate = $Rate
        networkCalls = 0
        paidCalls = 0
        finalVoiceAccepted = $false
        segments = $entries
    }
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText((Join-Path $audioRoot 'provenance.json'), ($metadata | ConvertTo-Json -Depth 6), $utf8)
    Write-Output "Created local voice take: $audioRoot"
} catch {
    Write-Warning 'Generation incomplete. Partial take is retained; choose a new take on retry.'
    throw
}
