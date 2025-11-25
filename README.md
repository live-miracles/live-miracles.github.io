## [Delayed YouTube](https://live-miracles.github.io/delayed-yt/)

<img width="700" alt="Delayed YouTube" src="https://github.com/user-attachments/assets/f929e929-07e4-4359-a7e9-a14f66fd353c">

Webpage where you can configure a delay for any YouTube
stream, and it will automatically maintain it. It solves the
skipping problem when because of network lag a stream with delay
goes to LIVE, and as a result, participants miss this skipped fragment.

## [Live Streaming Gallery](https://live-miracles.github.io/gallery/)

<img width="700" alt="Live Streaming Gallery" src="https://github.com/user-attachments/assets/d1a87eb1-1881-4400-912d-af3303c5e3f9">

Here you can monitor multiple YouTube, JW, Facebook, and other live broadcasts simultaneously.

It provides usefull features:

- Audio VU meter, which shows audio levels on the right side.
- Sets lowest quality for all playing YouTube videos.
- And others!

## [Gallery Chrome Extension](https://live-miracles.github.io/gallery-ext/)

<img width="400" alt="Gallery Chrome Extension" src="https://github.com/user-attachments/assets/c5bd58c8-836c-49cd-b97c-825182708ff3">

Because of the CORS policy, we can't access the videos with JavaScript directly. That's why a Chrome Extension is required to enable VU meters, lowest quality selection, and other features.

## [vMix Master](https://live-miracles.github.io/vmix-master/)

<img width="700" alt="vMix Master" src="https://github.com/user-attachments/assets/ad8fd4e9-939b-4239-84c4-10f47a881c47">

During live translations, we sometimes use multiple vMix systems. This web interface allows us to control multiple vMix systems in a master-slave relationship and much more.

- Custom Commands: remotely adjust input volume, turn on/off external devices, etc.
- vMix Web: Provides a web vMix-like interface.
- AudioFade script: this script prevents an abrupt auidio cut during the transitions.
- DurationTimer script: this script will print in a text input how many minutes:seconds of the video is left.
- Slave script: when master switches to the input n, this script will cause the current vMix (slave) to follow and switch to input n.

## Contribute

This repo contains the server and dev configs like prettier for the sub-repos.

Clone this repo if you want to contribute to any of the projects.

```sh
$ git clone --recurse-submodules git@github.com:live-miracles/live-miracles.github.io.git
$ make  # will start the server at port 3000
```

Adding new repo:

```sh
$ git submodule add git@github.com:live-miracles/other-repo.git path/inside/your/repo
```

Formatting code:

```sh
$ make pretty  # Format all files
$ make pretty DIR=vmix-master  # format files in a specific folder
```
