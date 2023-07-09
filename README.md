# YouTube-Likes-per-View
Takes a channel and returns a list of videos sorted by regression error (good outliers at the top, bad outliers at the bottom). Implemented as an App Script through Google Sheet. It is designed as a solution to help new viewers of a channel choose the best videos to watch.

Example: using channel data from In a Nutshell, the Egg is the best performing outlier in terms of deviating from the regression between view counts logged and like counts logged.
![Image of the Egg as an outlier in regression](https://github.com/jeqcho/YouTube-Likes-per-View/assets/42904912/f3b4b40e-bf72-4a08-a013-aedc4ec4d103)

Although it is called Likes-per-View, in reality we use regression deviation to sort as we find this to be a better measure than the ratios of like to view counts.


# Use case
You are welcome to make a copy of this spreadsheet and use the Finder. [YouTube Likes per View Finder](https://chojeq.com/youtube-finder)

<img width="1067" alt="image" src="https://github.com/jeqcho/YouTube-Likes-per-View/assets/42904912/f1cccbb8-a272-4876-bf4e-a6232b733ae3">


# Code
Refer to `Code.gs`.

# License
MIT
