#!/bin/bash
# Make the shorter YouTube version of a clip: the cold open (first COLD seconds of the file)
# followed by the FROM..TO section of the same file. Times are seconds into the clip file.
# Usage: yt-cut.sh <in.mp4> <out.mp4> <cold_seconds> <from_seconds> <to_seconds>
set -euo pipefail
in=$1 out=$2 cold=$3 from=$4 to=$5
FF="$(dirname "$0")/../../../../node_modules/ffmpeg-static/ffmpeg"

if [ "$cold" = "0" ]; then
  "$FF" -y -loglevel error -i "$in" -ss "$from" -to "$to" -c:v libx264 -preset veryfast -crf 18 -c:a aac "$out"
else
  "$FF" -y -loglevel error -i "$in" -filter_complex \
    "[0:v]trim=0:$cold,setpts=PTS-STARTPTS[v0];[0:a]atrim=0:$cold,asetpts=PTS-STARTPTS[a0];\
[0:v]trim=$from:$to,setpts=PTS-STARTPTS[v1];[0:a]atrim=$from:$to,asetpts=PTS-STARTPTS[a1];\
[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 18 -c:a aac "$out"
fi
