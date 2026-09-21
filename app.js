// ===================================================
// Pheasal Media & YouTube Pro - iOS WebApp Logic
// ===================================================

document.addEventListener('DOMContentLoaded', () => {

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW failed:', err));
  }

  // 2. Hide Install Banner if already added to Home Screen
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const banner = document.getElementById('iosInstallBanner');
  if (isStandalone) {
    banner.classList.add('hidden');
  }

  document.getElementById('btnCloseBanner').addEventListener('click', () => {
    banner.classList.add('hidden');
  });

  // 3. Tab Switching Logic
  const navBtns = document.querySelectorAll('.nav-item[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Pause local media when leaving
    if (tabId !== 'tab-video') {
      const vid = document.getElementById('mainVideoPlayer');
      if (vid && !vid.paused) vid.pause();
    }
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 4. Toast Notification Helper
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  }

  // 5. YouTube Tab Controls
  const ytFrame = document.getElementById('ytPlayerFrame');
  const ytInput = document.getElementById('ytSearchInput');
  const adblockBtn = document.getElementById('adblockToggle');
  const adblockStatus = document.getElementById('adblockStatusText');
  let isAdBlockOn = true;
  let currentYtVideoId = 'PLr6-GrHGFly2iQ7fU1V92M0_n62pXnQ8o';

  adblockBtn.addEventListener('click', () => {
    isAdBlockOn = !isAdBlockOn;
    if (isAdBlockOn) {
      adblockBtn.classList.remove('off');
      adblockStatus.textContent = 'គ្មាន Ads';
      showToast('🛡️ បានបើកមុខងារបិទពាណិជ្ជកម្ម (Ad Blocker Active)');
    } else {
      adblockBtn.classList.add('off');
      adblockStatus.textContent = 'Ads បើក';
      showToast('⚠️ បានបិទមុខងារការពារពាណិជ្ជកម្ម');
    }
  });

  document.getElementById('btnYtBack').addEventListener('click', () => {
    try {
      history.back();
    } catch(e) {}
  });

  document.getElementById('btnYtRefresh').addEventListener('click', () => {
    ytFrame.src = ytFrame.src;
    showToast('កំពុងដំណើរការឡើងវិញ...');
  });

  ytInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loadYouTubeContent(ytInput.value.trim());
    }
  });

  function extractYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  function loadYouTubeContent(query) {
    if (!query) return;
    const vidId = extractYouTubeId(query);
    if (vidId) {
      currentYtVideoId = vidId;
      ytFrame.src = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&modestbranding=1&rel=0`;
      showToast('កំពុងចាក់វីដេអូ YouTube...');
    } else {
      // Search query
      ytFrame.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}`;
      showToast('កំពុងស្វែងរក: ' + query);
    }
  }

  // 6. Downloader Modal
  const modalDownloader = document.getElementById('modalDownloader');
  const btnYtDownload = document.getElementById('btnYtDownload');
  const navBtnDownload = document.getElementById('navBtnDownload');
  const btnCloseDownloader = document.getElementById('btnCloseDownloader');

  function openDownloader() {
    let vidId = currentYtVideoId;
    if (ytInput.value.trim()) {
      const extracted = extractYouTubeId(ytInput.value.trim());
      if (extracted) vidId = extracted;
    }

    const mp4Url = `https://www.ssyoutube.com/watch?v=${vidId}`;
    const mp3Url = `https://y2mate.nu/en/convert/?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + vidId)}`;
    const fastUrl = `https://en.savefrom.net/248/?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + vidId)}`;

    document.getElementById('dlOptMP4').href = mp4Url;
    document.getElementById('dlOptMP3').href = mp3Url;
    document.getElementById('dlOptFast').href = fastUrl;

    modalDownloader.classList.add('open');
  }

  btnYtDownload.addEventListener('click', openDownloader);
  navBtnDownload.addEventListener('click', openDownloader);
  btnCloseDownloader.addEventListener('click', () => modalDownloader.classList.remove('open'));

  // 7. About Modal
  const modalAbout = document.getElementById('modalAbout');
  document.getElementById('navBtnAbout').addEventListener('click', () => {
    modalAbout.classList.add('open');
  });
  document.getElementById('btnCloseAbout').addEventListener('click', () => {
    modalAbout.classList.remove('open');
  });

  // Close modals on clicking overlay backdrop
  [modalDownloader, modalAbout].forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });

  // 8. Video Player Tab Logic
  const videoPlayer = document.getElementById('mainVideoPlayer');
  const videoPlaceholder = document.getElementById('videoPlaceholder');
  const videoListContainer = document.getElementById('videoListContainer');
  const videoFileInput = document.getElementById('videoFileInput');

  const sampleVideos = [
    {
      title: 'មេរៀនគំរូទី១៖ ការណែនាំមុខវិជ្ជា និងវិធីសាស្ត្ររៀន',
      subtitle: 'លោកគ្រូ ចែម ភាសាល • គុណភាពខ្ពស់ HD',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      title: 'មេរៀនគំរូទី២៖ ការអនុវត្តលំហាត់ និងទ្រឹស្តីសំខាន់ៗ',
      subtitle: 'លោកគ្រូ ចែម ភាសាល • គុណភាពខ្ពស់ HD',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      title: 'មេរៀនគំរូទី៣៖ សង្ខេបចំណុចគន្លឹះមុនពេលប្រឡង',
      subtitle: 'លោកគ្រូ ចែម ភាសាល • គុណភាពខ្ពស់ HD',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ];

  function renderVideoList() {
    videoListContainer.innerHTML = '';
    sampleVideos.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <div class="media-card-icon">▶</div>
        <div class="media-card-info">
          <div class="media-card-title">${item.title}</div>
          <div class="media-card-sub">${item.subtitle}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('#videoListContainer .media-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        playVideoItem(item);
      });
      videoListContainer.appendChild(card);
    });
  }

  function playVideoItem(item) {
    videoPlaceholder.style.display = 'none';
    videoPlayer.src = item.url;
    videoPlayer.play();
    showToast('កំពុងចាក់៖ ' + item.title);
  }

  videoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      const newVideo = {
        title: file.name,
        subtitle: 'វីដេអូពី iPhone • File ផ្ទាល់',
        url: objUrl
      };
      sampleVideos.unshift(newVideo);
      renderVideoList();
      playVideoItem(newVideo);
    }
  });

  renderVideoList();

  // 9. Audio Player Tab Logic
  const audioPlayer = document.getElementById('mainAudioPlayer');
  const audioArt = document.getElementById('audioArt');
  const audioTitle = document.getElementById('audioTitle');
  const audioArtist = document.getElementById('audioArtist');
  const audioScrubber = document.getElementById('audioScrubber');
  const audioCurrentTime = document.getElementById('audioCurrentTime');
  const audioTotalTime = document.getElementById('audioTotalTime');
  const btnAudioPlay = document.getElementById('btnAudioPlay');
  const btnAudioPrev = document.getElementById('btnAudioPrev');
  const btnAudioNext = document.getElementById('btnAudioNext');
  const audioListContainer = document.getElementById('audioListContainer');
  const audioFileInput = document.getElementById('audioFileInput');

  const sampleAudios = [
    {
      title: 'សម្លេងបង្រៀន MP3៖ សេចក្តីផ្តើមមេរៀន និងការពន្យល់',
      subtitle: 'លោកគ្រូ ចែម ភាសាល (គ្រូកម្រិតឧត្តម)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      title: 'សម្លេងបង្រៀន MP3៖ ការបកស្រាយពាក្យគន្លឹះ និងរូបមន្ត',
      subtitle: 'លោកគ្រូ ចែម ភាសាល (គ្រូកម្រិតឧត្តម)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    },
    {
      title: 'សម្លេងបង្រៀន MP3៖ សំណួរ ចម្លើយ និងការពិភាក្សា',
      subtitle: 'លោកគ្រូ ចែម ភាសាល (គ្រូកម្រិតឧត្តម)',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    }
  ];

  let currentAudioIndex = 0;

  function renderAudioList() {
    audioListContainer.innerHTML = '';
    sampleAudios.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'media-card' + (index === currentAudioIndex ? ' active' : '');
      card.innerHTML = `
        <div class="media-card-icon" style="color: #ff9900; background: rgba(255,153,0,0.15);">🎵</div>
        <div class="media-card-info">
          <div class="media-card-title">${item.title}</div>
          <div class="media-card-sub">${item.subtitle}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        currentAudioIndex = index;
        loadAndPlayAudio(currentAudioIndex);
      });
      audioListContainer.appendChild(card);
    });
  }

  function formatSecs(secs) {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function loadAndPlayAudio(index) {
    const item = sampleAudios[index];
    if (!item) return;

    audioTitle.textContent = item.title;
    audioArtist.textContent = item.subtitle;
    audioPlayer.src = item.url;
    audioPlayer.play();
    btnAudioPlay.textContent = '⏸';
    audioArt.classList.add('playing');
    showToast('កំពុងចាក់៖ ' + item.title);
    renderAudioList();
  }

  btnAudioPlay.addEventListener('click', () => {
    if (!audioPlayer.src) {
      loadAndPlayAudio(currentAudioIndex);
    } else if (audioPlayer.paused) {
      audioPlayer.play();
      btnAudioPlay.textContent = '⏸';
      audioArt.classList.add('playing');
    } else {
      audioPlayer.pause();
      btnAudioPlay.textContent = '▶';
      audioArt.classList.remove('playing');
    }
  });

  btnAudioPrev.addEventListener('click', () => {
    currentAudioIndex = (currentAudioIndex - 1 + sampleAudios.length) % sampleAudios.length;
    loadAndPlayAudio(currentAudioIndex);
  });

  btnAudioNext.addEventListener('click', () => {
    currentAudioIndex = (currentAudioIndex + 1) % sampleAudios.length;
    loadAndPlayAudio(currentAudioIndex);
  });

  audioPlayer.addEventListener('timeupdate', () => {
    if (!isNaN(audioPlayer.duration)) {
      audioScrubber.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      audioCurrentTime.textContent = formatSecs(audioPlayer.currentTime);
      audioTotalTime.textContent = formatSecs(audioPlayer.duration);
    }
  });

  audioPlayer.addEventListener('ended', () => {
    btnAudioNext.click();
  });

  audioScrubber.addEventListener('input', () => {
    if (!isNaN(audioPlayer.duration)) {
      audioPlayer.currentTime = (audioScrubber.value / 100) * audioPlayer.duration;
    }
  });

  audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      const newAudio = {
        title: file.name,
        subtitle: 'MP3 ពី iPhone • File ផ្ទាល់',
        url: objUrl
      };
      sampleAudios.unshift(newAudio);
      currentAudioIndex = 0;
      loadAndPlayAudio(0);
    }
  });

  renderAudioList();

});
