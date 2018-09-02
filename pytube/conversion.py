import moviepy
import requests
import pytube
from pytube import YouTube

import os
import os.path
from os import path

from moviepy.editor import *
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

# configuration
csvFilename = 'videos.csv'
storeDir = '../http/videos/store'
stagingDir = '../http/videos/downloading'
postDir = '../http/videos/post'

# deprecated - this video cutting works 
def cutVideoTime(inputFile, outputFile, startTime, duration):
  if not path.exists(outputFile):
    # calculate duration
    endTime = startTime + duration

    # with no end time specified we take until the end of the video
    if not duration:
      clip = VideoFileClip(inputFile)
      endTime = clip.duration
      ffmpeg_extract_subclip(inputFile, startTime, clip.duration, targetname=outputFile)
      print('  Cut - Extracted clip to end. Starting at ' + str(startTime) + '.')
    else:
      ffmpeg_extract_subclip(inputFile, startTime, endTime, targetname=outputFile)
      print('  Cut - Extracted clip from ' + str(startTime) + ' to ' + str(endTime))
  else:
    print '  Cut - Video already exists.'

# def cutVideos(inputDir, outputDir, csvFile):
#   reader = getCsvReader(csvFile)

#   for root, dirs, files in os.walk(dir):  
#     for name in files:
#       inputFile = os.path.join(root, name)
#       outputFile = 

#       print name
#       #cutVideoTime(, )

def getCsvReader(fileLocation):
  csv_reader = csv.DictReader(csv_file)
  csv_reader.fieldnames = "rank", "player", "youtube", "initialTime", "duration"
  return csv_reader

def getVideos():
  import csv
  with open(csvFilename, mode='r') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    csv_reader.fieldnames = "rank", "player", "youtube", "initialTime", "duration"
    line_count = 0
    for row in csv_reader:
      if line_count == 0:
        print('Column names are {", ".join(row)}')
        line_count += 1
      else:
        youtubeUrl = row['youtube']
        player = row['player']

        # initial could be nothing but this is more of an error
        initial = 0
        if row['initialTime']:
          initial = int(row['initialTime'])

        # duration could be nothing, which is the end of the video
        duration = 0
        if row['duration']:
          duration = int(row['duration'])

        if youtubeUrl:
          id = pytube.extract.video_id(youtubeUrl)

          print('Starting operation for ' + player)
          print ('  URL: ' + youtubeUrl)

          # we don't download this file if it exists in our store
          storeFile = storeDir + '/' + id + ".mp4"
          if path.exists(storeFile):
            print('  Download - File already exists in store locally.')
          else:
            yt = YouTube(youtubeUrl)
            # ,res='360p' = lower compression videos 
            yt.streams.filter(progressive=True, subtype='mp4').first().download(output_path=stagingDir, filename=id)
            line_count += 1
            print('  Downloaded - File create as id: ' + id)

          # Now move to downloaded directory (if it doesn't exist)
          stagingFile = stagingDir + '/' + id + '.mp4'
          if not path.exists(storeFile):
            os.rename(stagingFile, storeFile)

          # and delete the staging file
          if os.path.exists(stagingFile):
            os.remove(stagingFile)
            print '  Removed file.'

          # Run cut sequence, if file existed or not
          #postFile = postDir + '/' + id + '.mp4'
          #cutVideoTime(storeFile, postFile, initial, duration)

    print('- End of file processing.')


getVideos()
#cutVideos(stagingDir)

