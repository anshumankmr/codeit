
// setup live view
async function setupLiveView() {

  // if URL has a file
  if (linkData.file) {

    if (isMobile) {

      toggleSidebar(false);
      saveSidebarStateLS();

    } else {

      toggleSidebar(true);
      saveSidebarStateLS();

    }

    const fileName = linkData.file.name;
    const fileSha = linkData.file.sha;

    // change selected file
    changeSelectedFile(treeLoc.join(), fileSha, fileName, '\n\r', getFileLang(fileName),
                       [0, 0], [0, 0], false);
    
    
    // if URL has a live view flag
    if (linkData.openLive) {

      // if on mobile device
      if (isMobile) {

        // update bottom float
        updateFloat();

        // don't transition bottom float
        bottomWrapper.classList.add('notransition');

        // expand bottom float
        bottomWrapper.classList.add('expanded');

        // fix bottom float on safari
        if (isSafari) bottomWrapper.classList.add('fromtop');

        // restore transition on next frame
        onNextFrame(() => {
          bottomWrapper.classList.remove('notransition');
        });

      } else {

        // don't transition live view
        liveView.classList.add('notransition');

        // show live view
        liveView.classList.add('visible');

        // restore transition on next frame
        onNextFrame(() => {
          liveView.classList.remove('notransition');
        });

      }
      
    }
    

    // if file is not modified; fetch from Git
    if (!modifiedFiles[fileSha]) {

      // start loading
      startLoading();

      // get file from git
      const resp = await git.getFile(treeLoc, fileName);

      // change selected file
      changeSelectedFile(treeLoc.join(), fileSha, fileName, resp.content, getFileLang(fileName),
                         [0, 0], [0, 0], false);

      // stop loading
      stopLoading();

    } else { // else, load file from modifiedFiles object

      const modFile = modifiedFiles[fileSha];

      changeSelectedFile(modFile.dir, modFile.sha, modFile.name, modFile.content, modFile.lang,
                         modFile.caretPos, modFile.scrollPos, false);

    }
    
    
    // if URL has a live view flag
    if (linkData.openLive) {
      
      // open live view
      toggleLiveView(selectedFile);
      
    }

    
    // show file content in codeit
    cd.textContent = decodeUnicode(selectedFile.content);
    
    // change tab character
    if (cd.textContent.includes('\t')) {

      cd.options.tab = '\t';

    } else {

      cd.options.tab = '  ';

    }
    
    // change codeit lang
    cd.lang = selectedFile.lang;

    // set caret pos in codeit
    cd.setSelection(selectedFile.caretPos[0], selectedFile.caretPos[1]);

    // set scroll pos in codeit
    cd.scrollTo(selectedFile.scrollPos[0], selectedFile.scrollPos[1]);

    // clear codeit history
    cd.history = [];

    // update line numbers
    updateLineNumbersHTML();

    // if on desktop
    if (!isMobile) {

      // update scrollbar arrow
      updateScrollbarArrow();

    }

  }

}

// open live view when swiped up on bottom float
function addBottomSwipeListener() {

  let yBoundary = 30;

  let currentY;
  let initialY;
  let yOffset = 0;

  let active = false;
  let click = false;
  let swiped = false;

  let direction = 0;

  bottomWrapper.addEventListener('touchstart', dragStart, false);
  bottomWrapper.addEventListener('touchend', dragEnd, false);
  bottomWrapper.addEventListener('touchmove', drag, false);

  bottomWrapper.addEventListener('mousedown', dragStart, false);
  bottomWrapper.addEventListener('mouseup', dragEnd, false);
  bottomWrapper.addEventListener('mousemove', drag, false);

  function dragStart(e) {

    if (e.type === 'touchstart') {
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialY = e.clientY - yOffset;
    }

    active = true;
    click = true;
    swiped = false;

  }

  function dragEnd(e) {

    initialY = currentY;

    const clickedOnShare = (e.target ===
                            bottomWrapper.querySelector('.live-button.share'));

    // if clicked and bottom float is expanded
    if (click && bottomWrapper.classList.contains('expanded')) {

      // if did not click on share button
      if (!clickedOnShare) {

        e.preventDefault();
        e.stopPropagation();

        // fix bottom float on safari
        if (isSafari) {

          bottomWrapper.classList.remove('fromtop');
          bottomWrapper.classList.add('notransition');

          onNextFrame(() => {

            bottomWrapper.classList.remove('notransition');

            onNextFrame(() => {

              // retract bottom float
              bottomWrapper.classList.remove('expanded');

            });

          });

        } else {

          // retract bottom float
          bottomWrapper.classList.remove('expanded');

        }

        toggleLiveView(selectedFile);

      } else {

        // if clicked on share button,
        // share live view link

        // create a link
        const link = createLink({
          dir: treeLoc,
          file: selectedFile,
          openLive: true
        });

        if (isMobile) {

          try {

            navigator.share({
              title: 'Share live view',
              text: link
            });

          } catch(e) {

            copy(link);
            alert('Copied link to clipboard.');

          }

        } else {

          copy(link);
          alert('Copied link to clipboard.');

        }

      }

    }

    yOffset = 0;
    active = false;

  }

  function drag(e) {

    if (active) {

      e.preventDefault();

      if (e.type === 'touchmove') {
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentY = e.clientY - initialY;
      }

      yOffset = currentY;

      // check swipe direction
      if (yOffset < 0) {
        direction = 'up';
      } else {
        direction = 'down';
      }

      // check if passed swipe boundary
      if (Math.abs(yOffset) > yBoundary) {
        swiped = true;
      } else {
        swiped = false;
      }

      if (direction == 'up') {

        // if swiped up and bottom float isn't expanded
        if (swiped && !bottomWrapper.classList.contains('expanded')) {

          swiped = false;

          // expand bottom float
          bottomWrapper.classList.add('expanded');

          // fix bottom float on safari
          // when finished transitioning
          if (isSafari) {

            window.setTimeout(() => {

              bottomWrapper.classList.add('fromtop');

            }, 400);

          }

          toggleLiveView(selectedFile);

        }

      } else if (direction == 'down') {

        // if swiped down and bottom float is expanded
        if (swiped && bottomWrapper.classList.contains('expanded')) {

          swiped = false;

          // fix bottom float on safari
          if (isSafari) {

            bottomWrapper.classList.remove('fromtop');
            bottomWrapper.classList.add('notransition');

            onNextFrame(() => {

              bottomWrapper.classList.remove('notransition');

              onNextFrame(() => {

                // retract bottom float
                bottomWrapper.classList.remove('expanded');

              });

            });

          } else {

            // retract bottom float
            bottomWrapper.classList.remove('expanded');

          }

          toggleLiveView(selectedFile);

        }

      }

      click = false;

    }

  }

}

function updateLiveViewArrow() {

  if (selectedFile.lang == 'html' || selectedFile.lang == 'svg'
      || selectedFile.lang == 'python') {

    liveToggle.classList.add('visible');

  } else {

    liveToggle.classList.remove('visible');

  }

}


if (isMobile) {

  addBottomSwipeListener();

} else {

  liveToggle.querySelector('.arrow').addEventListener('click', () => {

    // toggle live view
    liveView.classList.toggle('visible');
    toggleLiveView(selectedFile);

  });

  liveToggle.querySelector('.share').addEventListener('click', () => {

    // if clicked on share button,
    // share live view link

    const link = createLink({
      dir: treeLoc,
      file: selectedFile,
      openLive: true
    });

    copy(link);
    alert('Copied link to clipboard.');

  });


  document.addEventListener('keydown', handleMetaP);

  function handleMetaP(e) {

    // detect ctrl/cmd+R
    if ((e.key === 'r' || e.keyCode === 82) && isKeyEventMeta(e)) {

      e.preventDefault();

      liveView.classList.toggle('visible');
      toggleLiveView(selectedFile);

    }

  }

}


let liveViewToggle;
let liveViewTimeout;

// toggle live view for file
function toggleLiveView(file) {

  liveViewToggle = !liveViewToggle;

  window.clearTimeout(liveViewTimeout);

  // if live view is visible
  if (liveViewToggle) {

    if (isMobile) {
      document.querySelector('meta[name="theme-color"]').content = '#1a1c24';
    }

    if (file.lang == 'html' || file.lang == 'svg') {

      window.setTimeout(() => {

        if (liveViewToggle && !liveView.classList.contains('loaded')) {

          liveView.classList.add('loading');

        }

      }, 1200);

      renderLiveViewHTML(file);

    } else if (file.lang == 'python') {
      
      window.setTimeout(() => {

        if (liveViewToggle && !liveView.classList.contains('loaded')) {

          liveView.classList.add('loading');

        }

      }, 1200);

      renderLiveViewPython(file);
      
    }

  } else {

    liveView.classList.remove('loading');

    if (isMobile) {

      // show loader
      liveView.classList.remove('loaded');

      document.querySelector('meta[name="theme-color"]').content = '#313744';

    }

    liveViewTimeout = window.setTimeout(() => {

      // clear live view
      liveView.innerHTML = '';

      if (!isMobile) {

        // show loader
        liveView.classList.remove('loaded');

      }

    }, 400);

  }

}


const liveFetchURL = window.location.origin + '/live-fetch/';

// render live view for HTML files
function renderLiveViewHTML(file) {

  // clear console
  console.clear();
  logVersion();


  liveView.innerHTML = '<iframe name="' + file.name + '" title="' + file.name + '" class="live-frame" allow="accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write" allowfullscreen="true" allowpaymentrequest="true" loading="lazy" sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation" scrolling="yes" frameborder="0"></iframe>';

  const frame = liveView.querySelector('.live-frame');
  const frameDocument = frame.contentDocument;

  frameDocument.addEventListener('keydown', handleMetaP);
  
  
  frameDocument.documentElement.innerHTML = decodeUnicode(file.content);

  
  // add <base> element
  
  const baseEl = frameDocument.createElement('base');
  baseEl.href = liveFetchURL;
  
  if (frameDocument.head.children.length > 0) {
    
    frameDocument.head.insertBefore(baseEl, frameDocument.head.children[0]);
    
  } else {
    
    frameDocument.head.appendChild(baseEl);
    
  }
  
  
  // fetch styles
  const frameLinks = frameDocument.querySelectorAll('link[rel="stylesheet"]');

  if (frameLinks.length > 0) {

    frameLinks.forEach(async (link) => {

      const linkHref = new URL(link.href);
      const fileName = linkHref.pathname.replace('/live-fetch/','');

      if (linkHref.href.startsWith(liveFetchURL)) {

        const file = Object.values(modifiedFiles).filter(file => (file.dir == selectedFile.dir.split(',') && file.name == fileName));
        let resp;

        if (!file[0]) {

          try {
            resp = await git.getFile(selectedFile.dir.split(','), fileName);
          } catch(e) { resp = ''; }

        } else {

          resp = file[0];

        }

        link.outerHTML = '<style>' + decodeUnicode(resp.content) + '</style>';

        // hide loader
        liveView.classList.add('loaded');

        // remove original tag
        link.remove();

      } else {

        // hide loader
        liveView.classList.add('loaded');

      }

    });

  } else {

    // hide loader
    liveView.classList.add('loaded');

  }

  // fetch scripts
  fetchLiveViewScripts(frameDocument);

  // fetch images
  frameDocument.querySelectorAll('img').forEach(async (image) => {

    const linkHref = new URL(image.src);
    const fileName = linkHref.pathname.replace('/live-fetch/','');

    if (linkHref.href.startsWith(liveFetchURL)) {

      // if image is in current directory
      if (!fileName.includes('/')) {

        // fetch file element for its SHA
        let fileEl = Array.from(fileWrapper.querySelectorAll('.item.file'))
                     .filter(file => file.querySelector('.name').textContent == fileName);

        fileEl = (fileEl.length > 0) ? fileEl[0] : null;

        // if image file exists
        if (fileEl !== null) {

          // fetch image

          let fileName = linkHref.pathname.split('/');
          fileName = fileName[fileName.length-1];

          // get MIME type (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)
          let mimeType = 'image/' + fileName.split('.')[1];

          if (mimeType.endsWith('svg')) mimeType = 'image/svg+xml';

          // get file as blob with SHA (up to 100MB)
          const resp = await git.getBlob(selectedFile.dir.split(','), getAttr(fileEl, 'sha'));

          image.src = 'data:' + mimeType + ';base64,' + resp.content;

        }

      } else if (!fileName.includes('./')) { // if image is below current directory

        // fetch image

        let fileName = linkHref.pathname.split('/');
        fileName = fileName[fileName.length-1];

        // get MIME type
        let mimeType = 'image/' + fileName.split('.')[1];

        if (mimeType.endsWith('svg')) mimeType = 'image/svg+xml';

        const fileDir = linkHref.pathname.replaceAll(fileName, '');

        const tree = selectedFile.dir.split(',');
        tree[2] = tree[2] + fileDir.slice(1, -1);

        const resp = await git.getFile(tree, fileName);

        image.src = 'data:' + mimeType + ';base64,' + resp.content;

      }

    }

  })

  // fetch videos
  frameDocument.querySelectorAll('video').forEach(async (video) => {

    const linkHref = new URL(video.src);
    const fileName = linkHref.pathname.replace('/live-fetch/','');

    if (linkHref.href.startsWith(liveFetchURL)) {

      // if video is in current directory
      if (!fileName.includes('/')) {

        // fetch file element for its SHA
        let fileEl = Array.from(fileWrapper.querySelectorAll('.item.file'))
                     .filter(file => file.querySelector('.name').textContent == fileName);

        fileEl = (fileEl.length > 0) ? fileEl[0] : null;

        // if video file exists
        if (fileEl !== null) {

          // fetch video

          let fileName = linkHref.pathname.split('/');
          fileName = fileName[fileName.length-1];

          // get MIME type
          let mimeType = 'video/' + fileName.split('.')[1];

          if (mimeType.endsWith('avi')) mimeType = 'video/x-msvideo';
          if (mimeType.endsWith('ogv')) mimeType = 'video/ogg';
          if (mimeType.endsWith('ts')) mimeType = 'video/mp2t';

          // get file as blob with SHA (up to 100MB)
          const resp = await git.getBlob(selectedFile.dir.split(','), getAttr(fileEl, 'sha'));

          video.src = 'data:' + mimeType + ';base64,' + resp.content;

        }

      }

    }

  })

  // fetch audio
  frameDocument.querySelectorAll('audio').forEach(async (audio) => {

    const linkHref = new URL(audio.src);
    const fileName = linkHref.pathname.replace('/live-fetch/','');

    if (linkHref.href.startsWith(liveFetchURL)) {

      // if audio file is in current directory
      if (!fileName.includes('/')) {

        // fetch file element for its SHA
        let fileEl = Array.from(fileWrapper.querySelectorAll('.item.file'))
                     .filter(file => file.querySelector('.name').textContent == fileName);

        fileEl = (fileEl.length > 0) ? fileEl[0] : null;

        // if audio file exists
        if (fileEl !== null) {

          // fetch audio

          // get file as blob with SHA (up to 100MB)
          const resp = await git.getBlob(selectedFile.dir.split(','), getAttr(fileEl, 'sha'));

          audio.src = 'data:audio/mpeg;base64,' + resp.content;

        }

      }

    }

  })

}


async function fetchLiveViewScripts(frameDocument) {

  // fetch scripts
  await asyncForEach(frameDocument.querySelectorAll('script'), async (script) => {

    // if script is external
    if (script.src) {

      const linkHref = new URL(script.src);
      const fileName = linkHref.pathname.replace('/live-fetch/','');

      if (linkHref.href.startsWith(liveFetchURL)) {

        const file = Object.values(modifiedFiles).filter(file => (file.dir == selectedFile.dir.split(',') && file.name == fileName));
        let resp;

        if (!file[0]) {

          resp = await git.getFile(selectedFile.dir.split(','), fileName);

        } else {

          resp = file[0];

        }

        addScript(frameDocument, decodeUnicode(resp.content), false, script.type);

        // remove original tag
        script.remove();

      } else {
        
        await addScript(frameDocument, false, script.src, script.type);

        // delete original
        script.remove();

      }

    } else {

      let scriptContent = script.textContent;
      
      // if script is a module
      if (script.type === 'module') {
        
        const filePath = selectedFile.dir.split(',')[2];
        
        // get all imports in module
        scriptContent = await moduleImporter.getImports(scriptContent, filePath);

      }
      
      addScript(frameDocument, scriptContent, false, script.type);

      // delete original
      script.remove();

    }

  });

}


function addScript(documentNode, code, src, type) {

  return new Promise((resolve) => {

    const script = documentNode.createElement('script');

    if (type && type != '') script.type = type;

    if (code) {

      script.appendChild(documentNode.createTextNode(code));

    } else {

      script.src = src;
      script.defer = true;
      script.async = false;

      script.onload = resolve;
      script.onerror = resolve;

    }

    documentNode.head.appendChild(script);

  });

}



// render live view for Python files
async function renderLiveViewPython(file) {

  // clear console
  console.clear();
  logVersion();


  liveView.innerHTML = '<iframe name="Python Context" class="python-frame"></iframe> <div class="console"></div>';
  
  const consoleEl = liveView.querySelector('.console');
  const pythonFrame = liveView.querySelector('.python-frame').contentWindow;
  
  
  pythonFrame.eval(`!function(global,factory){"object"==typeof exports&&"undefined"!=typeof module?factory(exports):"function"==typeof define&&define.amd?define(["exports"],factory):factory((global="undefined"!=typeof globalThis?globalThis:global||self).loadPyodide={})}(this,(function(exports){"use strict";let Module={};function setStandardStreams(stdin,stdout,stderr){stdout&&(Module.print=stdout),stderr&&(Module.printErr=stderr),stdin&&Module.preRun.push((function(){Module.FS.init(function(stdin){const encoder=new TextEncoder;let input=new Uint8Array(0),inputIndex=-1;function stdinWrapper(){try{if(-1===inputIndex){let text=stdin();if(null==text)return null;if("string"!=typeof text)throw new TypeError(`Expected stdin to return string, null, or undefined, got type ${typeof text}.`);text.endsWith("\n")||(text+="\n"),input=encoder.encode(text),inputIndex=0}if(inputIndex<input.length){let character=input[inputIndex];return inputIndex++,character}return inputIndex=-1,null}catch(e){throw console.error("Error thrown in stdin:"),console.error(e),e}}return stdinWrapper}(stdin),null,null)}))}Module.noImageDecoding=!0,Module.noAudioDecoding=!0,Module.noWasmDecoding=!1,Module.preloadedWasm={},Module.preRun=[];const IN_NODE="undefined"!=typeof process&&process.release&&"node"===process.release.name&&void 0===process.browser;let baseURL;const package_uri_regexp=/^.*?([^\/]*)\.js$/;function _uri_to_package_name(package_uri){let match=package_uri_regexp.exec(package_uri);if(match)return match[1].toLowerCase()}let loadScript;if(globalThis.document)loadScript=async url=>await import(url);else if(globalThis.importScripts)loadScript=async url=>{globalThis.importScripts(url)};else{if(!IN_NODE)throw new Error("Cannot determine runtime environment");{const pathPromise=import("path").then((M=>M.default)),fetchPromise=import("node-fetch").then((M=>M.default)),vmPromise=import("vm").then((M=>M.default));loadScript=async url=>{if(url.includes("://")){const fetch=await fetchPromise;(await vmPromise).runInThisContext(await(await fetch(url)).text())}else{const path=await pathPromise;await import(path.resolve(url))}}}}function addPackageToLoad(name,toLoad){if(name=name.toLowerCase(),!toLoad.has(name)&&(toLoad.set(name,"default channel"),void 0===loadedPackages[name]))for(let dep_name of Module.packages[name].depends)addPackageToLoad(dep_name,toLoad)}function recursiveDependencies(names,_messageCallback,errorCallback,sharedLibsOnly){const toLoad=new Map;for(let name of names){const pkgname=_uri_to_package_name(name);toLoad.has(pkgname)&&toLoad.get(pkgname)!==name?errorCallback(`Loading same package ${pkgname} from ${name} and ${toLoad.get(pkgname)}`):void 0===pkgname?(name=name.toLowerCase(),name in Module.packages?addPackageToLoad(name,toLoad):errorCallback(`Skipping unknown package '${name}'`)):toLoad.set(pkgname,name)}if(sharedLibsOnly){let onlySharedLibs=new Map;for(let c of toLoad){let name=c[0];Module.packages[name].shared_library&&onlySharedLibs.set(name,toLoad.get(name))}return onlySharedLibs}return toLoad}function waitRunDependency(){const promise=new Promise((r=>{Module.monitorRunDependencies=n=>{0===n&&r()}}));return Module.addRunDependency("dummy"),Module.removeRunDependency("dummy"),promise}async function _loadPackage(names,messageCallback,errorCallback){let toLoad=recursiveDependencies(names,0,errorCallback);if(Module.locateFile_packagesToLoad=toLoad,0===toLoad.size)return Promise.resolve("No new packages to load");messageCallback(`Loading ${Array.from(toLoad.keys()).join(", ")}`);let scriptPromises=[];for(let[pkg,uri]of toLoad){let loaded=loadedPackages[pkg];if(void 0!==loaded){if(loaded===uri||"default channel"===uri){messageCallback(`${pkg} already loaded from ${loaded}`);continue}errorCallback(`URI mismatch, attempting to load package ${pkg} from ${uri} while it is already loaded from ${loaded}. To override a dependency, load the custom package first.`);continue}let pkgname=Module.packages[pkg]&&Module.packages[pkg].name||pkg,scriptSrc="default channel"===uri?`${baseURL}${pkgname}.js`:uri;messageCallback(`Loading ${pkg} from ${scriptSrc}`),scriptPromises.push(loadScript(scriptSrc).catch((e=>{errorCallback(`Couldn't load package from URL ${scriptSrc}`,e),toLoad.delete(pkg)})))}try{await Promise.all(scriptPromises).then(waitRunDependency)}finally{delete Module.monitorRunDependencies}let resolveMsg,packageList=[];for(let[pkg,uri]of toLoad)loadedPackages[pkg]=uri,packageList.push(pkg);if(packageList.length>0){resolveMsg=`Loaded ${packageList.join(", ")}`}else resolveMsg="No packages loaded";Module.reportUndefinedSymbols(),messageCallback(resolveMsg),Module.importlib.invalidate_caches()}Module.locateFile=function(path){let pkg=path.replace(/\.data$/,"");const toLoad=Module.locateFile_packagesToLoad;if(toLoad&&toLoad.has(pkg)){let package_uri=toLoad.get(pkg);if("default channel"!=package_uri)return package_uri.replace(/\.js$/,".data")}return baseURL+path};let _package_lock=Promise.resolve();let sharedLibraryWasmPlugin,origWasmPlugin,wasmPluginIndex,loadedPackages={};function useSharedLibraryWasmPlugin(){sharedLibraryWasmPlugin||function(){for(let p in Module.preloadPlugins)if(Module.preloadPlugins[p].canHandle("test.so")){origWasmPlugin=Module.preloadPlugins[p],wasmPluginIndex=p;break}sharedLibraryWasmPlugin={canHandle:origWasmPlugin.canHandle,handle(byteArray,name,onload,onerror){origWasmPlugin.handle(byteArray,name,onload,onerror),origWasmPlugin.asyncWasmLoadPromise=(async()=>{await origWasmPlugin.asyncWasmLoadPromise,Module.loadDynamicLibrary(name,{global:!0,nodelete:!0})})()}}}(),Module.preloadPlugins[wasmPluginIndex]=sharedLibraryWasmPlugin}function restoreOrigWasmPlugin(){Module.preloadPlugins[wasmPluginIndex]=origWasmPlugin}async function loadPackage(names,messageCallback,errorCallback){if(Module.isPyProxy(names)){let temp;try{temp=names.toJs()}finally{names.destroy()}names=temp}Array.isArray(names)||(names=[names]);let sharedLibraryNames=[];try{let sharedLibraryPackagesToLoad=recursiveDependencies(names,0,errorCallback,!0);for(let pkg of sharedLibraryPackagesToLoad)sharedLibraryNames.push(pkg[0])}catch(e){}let releaseLock=await async function(){let releaseLock,old_lock=_package_lock;return _package_lock=new Promise((resolve=>releaseLock=resolve)),await old_lock,releaseLock}();try{useSharedLibraryWasmPlugin(),await _loadPackage(sharedLibraryNames,messageCallback||console.log,errorCallback||console.error),restoreOrigWasmPlugin(),await _loadPackage(names,messageCallback||console.log,errorCallback||console.error)}finally{restoreOrigWasmPlugin(),releaseLock()}}function isPyProxy(jsobj){return!!jsobj&&void 0!==jsobj.$$&&"PyProxy"===jsobj.$$.type}Module.isPyProxy=isPyProxy,globalThis.FinalizationRegistry?Module.finalizationRegistry=new FinalizationRegistry((([ptr,cache])=>{cache.leaked=!0,pyproxy_decref_cache(cache);try{Module._Py_DecRef(ptr)}catch(e){Module.fatal_error(e)}})):Module.finalizationRegistry={register(){},unregister(){}};let trace_pyproxy_alloc,trace_pyproxy_dealloc,pyproxy_alloc_map=new Map;function _getPtr(jsobj){let ptr=jsobj.$$.ptr;if(null===ptr)throw new Error(jsobj.$$.destroyed_msg||"Object has already been destroyed");return ptr}Module.pyproxy_alloc_map=pyproxy_alloc_map,Module.enable_pyproxy_allocation_tracing=function(){trace_pyproxy_alloc=function(proxy){pyproxy_alloc_map.set(proxy,Error().stack)},trace_pyproxy_dealloc=function(proxy){pyproxy_alloc_map.delete(proxy)}},Module.disable_pyproxy_allocation_tracing=function(){trace_pyproxy_alloc=function(proxy){},trace_pyproxy_dealloc=function(proxy){}},Module.disable_pyproxy_allocation_tracing(),Module.pyproxy_new=function(ptrobj,cache){let target,flags=Module._pyproxy_getflags(ptrobj),cls=Module.getPyProxyClass(flags);if(256&flags?(target=Reflect.construct(Function,[],cls),delete target.length,delete target.name,target.prototype=void 0):target=Object.create(cls.prototype),!cache){cache={cacheId:Module.hiwire.new_value(new Map),refcnt:0}}cache.refcnt++,Object.defineProperty(target,"$$",{value:{ptr:ptrobj,type:"PyProxy",cache:cache}}),Module._Py_IncRef(ptrobj);let proxy=new Proxy(target,PyProxyHandlers);return trace_pyproxy_alloc(proxy),Module.finalizationRegistry.register(proxy,[ptrobj,cache],proxy),proxy};let pyproxyClassMap=new Map;Module.getPyProxyClass=function(flags){let result=pyproxyClassMap.get(flags);if(result)return result;let descriptors={};for(let[feature_flag,methods]of[[1,PyProxyLengthMethods],[2,PyProxyGetItemMethods],[4,PyProxySetItemMethods],[8,PyProxyContainsMethods],[16,PyProxyIterableMethods],[32,PyProxyIteratorMethods],[64,PyProxyAwaitableMethods],[128,PyProxyBufferMethods],[256,PyProxyCallableMethods]])flags&feature_flag&&Object.assign(descriptors,Object.getOwnPropertyDescriptors(methods.prototype));descriptors.constructor=Object.getOwnPropertyDescriptor(PyProxyClass.prototype,"constructor"),Object.assign(descriptors,Object.getOwnPropertyDescriptors({$$flags:flags}));let new_proto=Object.create(PyProxyClass.prototype,descriptors);function NewPyProxyClass(){}return NewPyProxyClass.prototype=new_proto,pyproxyClassMap.set(flags,NewPyProxyClass),NewPyProxyClass},Module.PyProxy_getPtr=_getPtr;function pyproxy_decref_cache(cache){if(cache&&(cache.refcnt--,0===cache.refcnt)){let cache_map=Module.hiwire.pop_value(cache.cacheId);for(let proxy_id of cache_map.values()){const cache_entry=Module.hiwire.pop_value(proxy_id);cache.leaked||Module.pyproxy_destroy(cache_entry,"This borrowed attribute proxy was automatically destroyed in the process of destroying the proxy it was borrowed from. Try using the 'copy' method.")}}}Module.pyproxy_destroy=function(proxy,destroyed_msg){if(null===proxy.$$.ptr)return;let ptrobj=_getPtr(proxy);Module.finalizationRegistry.unregister(proxy),proxy.$$.ptr=null,proxy.$$.destroyed_msg=destroyed_msg,pyproxy_decref_cache(proxy.$$.cache);try{Module._Py_DecRef(ptrobj),trace_pyproxy_dealloc(proxy)}catch(e){Module.fatal_error(e)}},Module.callPyObjectKwargs=function(ptrobj,...jsargs){let kwargs=jsargs.pop(),num_pos_args=jsargs.length,kwargs_names=Object.keys(kwargs),kwargs_values=Object.values(kwargs),num_kwargs=kwargs_names.length;jsargs.push(...kwargs_values);let idresult,idargs=Module.hiwire.new_value(jsargs),idkwnames=Module.hiwire.new_value(kwargs_names);try{idresult=Module.__pyproxy_apply(ptrobj,idargs,num_pos_args,idkwnames,num_kwargs)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idargs),Module.hiwire.decref(idkwnames)}return 0===idresult&&Module._pythonexc2js(),Module.hiwire.pop_value(idresult)},Module.callPyObject=function(ptrobj,...jsargs){return Module.callPyObjectKwargs(ptrobj,...jsargs,{})};class PyProxyClass{constructor(){throw new TypeError("PyProxy is not a constructor")}get[Symbol.toStringTag](){return"PyProxy"}get type(){let ptrobj=_getPtr(this);return Module.hiwire.pop_value(Module.__pyproxy_type(ptrobj))}toString(){let jsref_repr,ptrobj=_getPtr(this);try{jsref_repr=Module.__pyproxy_repr(ptrobj)}catch(e){Module.fatal_error(e)}return 0===jsref_repr&&Module._pythonexc2js(),Module.hiwire.pop_value(jsref_repr)}destroy(destroyed_msg){Module.pyproxy_destroy(this,destroyed_msg)}copy(){let ptrobj=_getPtr(this);return Module.pyproxy_new(ptrobj,this.$$.cache)}toJs({depth:depth=-1,pyproxies:pyproxies,create_pyproxies:create_pyproxies=!0,dict_converter:dict_converter}={}){let idresult,proxies_id,ptrobj=_getPtr(this),dict_converter_id=0;proxies_id=create_pyproxies?pyproxies?Module.hiwire.new_value(pyproxies):Module.hiwire.new_value([]):0,dict_converter&&(dict_converter_id=Module.hiwire.new_value(dict_converter));try{idresult=Module._python2js_custom_dict_converter(ptrobj,depth,proxies_id,dict_converter_id)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(proxies_id),Module.hiwire.decref(dict_converter_id)}return 0===idresult&&Module._pythonexc2js(),Module.hiwire.pop_value(idresult)}supportsLength(){return!!(1&this.$$flags)}supportsGet(){return!!(2&this.$$flags)}supportsSet(){return!!(4&this.$$flags)}supportsHas(){return!!(8&this.$$flags)}isIterable(){return!!(48&this.$$flags)}isIterator(){return!!(32&this.$$flags)}isAwaitable(){return!!(64&this.$$flags)}isBuffer(){return!!(128&this.$$flags)}isCallable(){return!!(256&this.$$flags)}}class PyProxyLengthMethods{get length(){let length,ptrobj=_getPtr(this);try{length=Module._PyObject_Size(ptrobj)}catch(e){Module.fatal_error(e)}return-1===length&&Module._pythonexc2js(),length}}class PyProxyGetItemMethods{get(key){let idresult,ptrobj=_getPtr(this),idkey=Module.hiwire.new_value(key);try{idresult=Module.__pyproxy_getitem(ptrobj,idkey)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}if(0===idresult){if(!Module._PyErr_Occurred())return;Module._pythonexc2js()}return Module.hiwire.pop_value(idresult)}}class PyProxySetItemMethods{set(key,value){let errcode,ptrobj=_getPtr(this),idkey=Module.hiwire.new_value(key),idval=Module.hiwire.new_value(value);try{errcode=Module.__pyproxy_setitem(ptrobj,idkey,idval)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey),Module.hiwire.decref(idval)}-1===errcode&&Module._pythonexc2js()}delete(key){let errcode,ptrobj=_getPtr(this),idkey=Module.hiwire.new_value(key);try{errcode=Module.__pyproxy_delitem(ptrobj,idkey)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}-1===errcode&&Module._pythonexc2js()}}class PyProxyContainsMethods{has(key){let result,ptrobj=_getPtr(this),idkey=Module.hiwire.new_value(key);try{result=Module.__pyproxy_contains(ptrobj,idkey)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}return-1===result&&Module._pythonexc2js(),1===result}}class PyProxyIterableMethods{[Symbol.iterator](){let iterptr,ptrobj=_getPtr(this),token={};try{iterptr=Module._PyObject_GetIter(ptrobj)}catch(e){Module.fatal_error(e)}0===iterptr&&Module._pythonexc2js();let result=function*(iterptr,token){try{let item;for(;item=Module.__pyproxy_iter_next(iterptr);)yield Module.hiwire.pop_value(item)}catch(e){Module.fatal_error(e)}finally{Module.finalizationRegistry.unregister(token),Module._Py_DecRef(iterptr)}Module._PyErr_Occurred()&&Module._pythonexc2js()}(iterptr,token);return Module.finalizationRegistry.register(result,[iterptr,void 0],token),result}}class PyProxyIteratorMethods{[Symbol.iterator](){return this}next(arg){let idresult,done,idarg=Module.hiwire.new_value(arg);try{idresult=Module.__pyproxyGen_Send(_getPtr(this),idarg),done=0===idresult,done&&(idresult=Module.__pyproxyGen_FetchStopIterationValue())}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idarg)}return done&&0===idresult&&Module._pythonexc2js(),{done:done,value:Module.hiwire.pop_value(idresult)}}}let PyProxyHandlers={isExtensible:()=>!0,has:(jsobj,jskey)=>!!Reflect.has(jsobj,jskey)||"symbol"!=typeof jskey&&(jskey.startsWith("$")&&(jskey=jskey.slice(1)),function(jsobj,jskey){let result,ptrobj=_getPtr(jsobj),idkey=Module.hiwire.new_value(jskey);try{result=Module.__pyproxy_hasattr(ptrobj,idkey)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}return-1===result&&Module._pythonexc2js(),0!==result}(jsobj,jskey)),get(jsobj,jskey){if(jskey in jsobj||"symbol"==typeof jskey)return Reflect.get(jsobj,jskey);jskey.startsWith("$")&&(jskey=jskey.slice(1));let idresult=function(jsobj,jskey){let idresult,ptrobj=_getPtr(jsobj),idkey=Module.hiwire.new_value(jskey),cacheId=jsobj.$$.cache.cacheId;try{idresult=Module.__pyproxy_getattr(ptrobj,idkey,cacheId)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}return 0===idresult&&Module._PyErr_Occurred()&&Module._pythonexc2js(),idresult}(jsobj,jskey);return 0!==idresult?Module.hiwire.pop_value(idresult):void 0},set(jsobj,jskey,jsval){let descr=Object.getOwnPropertyDescriptor(jsobj,jskey);if(descr&&!descr.writable)throw new TypeError(`Cannot set read only field '${jskey}'`);return"symbol"==typeof jskey?Reflect.set(jsobj,jskey,jsval):(jskey.startsWith("$")&&(jskey=jskey.slice(1)),function(jsobj,jskey,jsval){let errcode,ptrobj=_getPtr(jsobj),idkey=Module.hiwire.new_value(jskey),idval=Module.hiwire.new_value(jsval);try{errcode=Module.__pyproxy_setattr(ptrobj,idkey,idval)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey),Module.hiwire.decref(idval)}-1===errcode&&Module._pythonexc2js()}(jsobj,jskey,jsval),!0)},deleteProperty(jsobj,jskey){let descr=Object.getOwnPropertyDescriptor(jsobj,jskey);if(descr&&!descr.writable)throw new TypeError(`Cannot delete read only field '${jskey}'`);return"symbol"==typeof jskey?Reflect.deleteProperty(jsobj,jskey):(jskey.startsWith("$")&&(jskey=jskey.slice(1)),function(jsobj,jskey){let errcode,ptrobj=_getPtr(jsobj),idkey=Module.hiwire.new_value(jskey);try{errcode=Module.__pyproxy_delattr(ptrobj,idkey)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(idkey)}-1===errcode&&Module._pythonexc2js()}(jsobj,jskey),!descr||descr.configurable)},ownKeys(jsobj){let idresult,ptrobj=_getPtr(jsobj);try{idresult=Module.__pyproxy_ownKeys(ptrobj)}catch(e){Module.fatal_error(e)}0===idresult&&Module._pythonexc2js();let result=Module.hiwire.pop_value(idresult);return result.push(...Reflect.ownKeys(jsobj)),result},apply:(jsobj,jsthis,jsargs)=>jsobj.apply(jsthis,jsargs)};class PyProxyAwaitableMethods{_ensure_future(){if(this.$$.promise)return this.$$.promise;let resolveHandle,rejectHandle,errcode,ptrobj=_getPtr(this),promise=new Promise(((resolve,reject)=>{resolveHandle=resolve,rejectHandle=reject})),resolve_handle_id=Module.hiwire.new_value(resolveHandle),reject_handle_id=Module.hiwire.new_value(rejectHandle);try{errcode=Module.__pyproxy_ensure_future(ptrobj,resolve_handle_id,reject_handle_id)}catch(e){Module.fatal_error(e)}finally{Module.hiwire.decref(reject_handle_id),Module.hiwire.decref(resolve_handle_id)}return-1===errcode&&Module._pythonexc2js(),this.$$.promise=promise,this.destroy(),promise}then(onFulfilled,onRejected){return this._ensure_future().then(onFulfilled,onRejected)}catch(onRejected){return this._ensure_future().catch(onRejected)}finally(onFinally){return this._ensure_future().finally(onFinally)}}class PyProxyCallableMethods{apply(jsthis,jsargs){return Module.callPyObject(_getPtr(this),...jsargs)}call(jsthis,...jsargs){return Module.callPyObject(_getPtr(this),...jsargs)}callKwargs(...jsargs){if(0===jsargs.length)throw new TypeError("callKwargs requires at least one argument (the key word argument object)");let kwargs=jsargs[jsargs.length-1];if(void 0!==kwargs.constructor&&"Object"!==kwargs.constructor.name)throw new TypeError("kwargs argument is not an object");return Module.callPyObjectKwargs(_getPtr(this),...jsargs)}}PyProxyCallableMethods.prototype.prototype=Function.prototype;let type_to_array_map=new Map([["i8",Int8Array],["u8",Uint8Array],["u8clamped",Uint8ClampedArray],["i16",Int16Array],["u16",Uint16Array],["i32",Int32Array],["u32",Uint32Array],["i32",Int32Array],["u32",Uint32Array],["i64",globalThis.BigInt64Array],["u64",globalThis.BigUint64Array],["f32",Float32Array],["f64",Float64Array],["dataview",DataView]]);class PyProxyBufferMethods{getBuffer(type){let ArrayType;if(type&&(ArrayType=type_to_array_map.get(type),void 0===ArrayType))throw new Error(`Unknown type ${type}`);let errcode,HEAPU32=Module.HEAPU32,orig_stack_ptr=Module.stackSave(),buffer_struct_ptr=Module.stackAlloc(HEAPU32[0+(Module._buffer_struct_size>>2)]),this_ptr=_getPtr(this);try{errcode=Module.__pyproxy_get_buffer(buffer_struct_ptr,this_ptr)}catch(e){Module.fatal_error(e)}-1===errcode&&Module._pythonexc2js();let startByteOffset=HEAPU32[0+(buffer_struct_ptr>>2)],minByteOffset=HEAPU32[1+(buffer_struct_ptr>>2)],maxByteOffset=HEAPU32[2+(buffer_struct_ptr>>2)],readonly=!!HEAPU32[3+(buffer_struct_ptr>>2)],format_ptr=HEAPU32[4+(buffer_struct_ptr>>2)],itemsize=HEAPU32[5+(buffer_struct_ptr>>2)],shape=Module.hiwire.pop_value(HEAPU32[6+(buffer_struct_ptr>>2)]),strides=Module.hiwire.pop_value(HEAPU32[7+(buffer_struct_ptr>>2)]),view_ptr=HEAPU32[8+(buffer_struct_ptr>>2)],c_contiguous=!!HEAPU32[9+(buffer_struct_ptr>>2)],f_contiguous=!!HEAPU32[10+(buffer_struct_ptr>>2)],format=Module.UTF8ToString(format_ptr);Module.stackRestore(orig_stack_ptr);let success=!1;try{let bigEndian=!1;void 0===ArrayType&&([ArrayType,bigEndian]=Module.processBufferFormatString(format," In this case, you can pass an explicit type argument."));let alignment=parseInt(ArrayType.name.replace(/[^0-9]/g,""))/8||1;if(bigEndian&&alignment>1)throw new Error("Javascript has no native support for big endian buffers. In this case, you can pass an explicit type argument. For instance, `getBuffer('dataview')` will return a `DataView`which has native support for reading big endian data. Alternatively, toJs will automatically convert the buffer to little endian.");let numBytes=maxByteOffset-minByteOffset;if(0!==numBytes&&(startByteOffset%alignment!=0||minByteOffset%alignment!=0||maxByteOffset%alignment!=0))throw new Error(`Buffer does not have valid alignment for a ${ArrayType.name}`);let data,numEntries=numBytes/alignment,offset=(startByteOffset-minByteOffset)/alignment;data=0===numBytes?new ArrayType:new ArrayType(HEAPU32.buffer,minByteOffset,numEntries);for(let i of strides.keys())strides[i]/=alignment;return success=!0,Object.create(PyBuffer.prototype,Object.getOwnPropertyDescriptors({offset:offset,readonly:readonly,format:format,itemsize:itemsize,ndim:shape.length,nbytes:numBytes,shape:shape,strides:strides,data:data,c_contiguous:c_contiguous,f_contiguous:f_contiguous,_view_ptr:view_ptr,_released:!1}))}finally{if(!success)try{Module._PyBuffer_Release(view_ptr),Module._PyMem_Free(view_ptr)}catch(e){Module.fatal_error(e)}}}}class PyBuffer{constructor(){throw this.offset,this.readonly,this.format,this.itemsize,this.ndim,this.nbytes,this.shape,this.strides,this.data,this.c_contiguous,this.f_contiguous,new TypeError("PyBuffer is not a constructor")}release(){if(!this._released){try{Module._PyBuffer_Release(this._view_ptr),Module._PyMem_Free(this._view_ptr)}catch(e){Module.fatal_error(e)}this._released=!0,this.data=null}}}let pyodide_py={},globals={};class PythonError{constructor(){this.message}}function runPython(code,globals=Module.globals){return Module.pyodide_py.eval_code(code,globals)}async function loadPackagesFromImports(code,messageCallback,errorCallback){let imports,pyimports=Module.pyodide_py.find_imports(code);try{imports=pyimports.toJs()}finally{pyimports.destroy()}if(0===imports.length)return;let packageNames=Module._import_name_to_package_name,packages=new Set;for(let name of imports)packageNames.has(name)&&packages.add(packageNames.get(name));packages.size&&await loadPackage(Array.from(packages),messageCallback,errorCallback)}async function runPythonAsync(code,globals=Module.globals){return await Module.pyodide_py.eval_code_async(code,globals)}function registerJsModule(name,module){Module.pyodide_py.register_js_module(name,module)}function registerComlink(Comlink){Module._Comlink=Comlink}function unregisterJsModule(name){Module.pyodide_py.unregister_js_module(name)}function toPy(obj,{depth:depth=-1}={}){switch(typeof obj){case"string":case"number":case"boolean":case"bigint":case"undefined":return obj}if(!obj||Module.isPyProxy(obj))return obj;let obj_id=0,py_result=0,result=0;try{obj_id=Module.hiwire.new_value(obj);try{py_result=Module.js2python_convert(obj_id,new Map,depth)}catch(e){throw e instanceof Module._PropagatePythonError&&Module._pythonexc2js(),e}if(Module._JsProxy_Check(py_result))return obj;result=Module._python2js(py_result),0===result&&Module._pythonexc2js()}finally{Module.hiwire.decref(obj_id),Module._Py_DecRef(py_result)}return Module.hiwire.pop_value(result)}function pyimport(mod_name){return Module.importlib.import_module(mod_name)}function unpackArchive(buffer,format,extract_dir){Module._util_module||(Module._util_module=pyimport("pyodide._util")),Module._util_module.unpack_buffer_archive.callKwargs(buffer,{format:format,extract_dir:extract_dir})}function setInterruptBuffer(interrupt_buffer){Module.interrupt_buffer=interrupt_buffer,Module._set_pyodide_callback(!!interrupt_buffer)}function checkInterrupt(){2===Module.interrupt_buffer[0]&&(Module.interrupt_buffer[0]=0,Module._PyErr_SetInterrupt(),Module.runPython(""))}function makePublicAPI(){const FS=Module.FS;let namespace={globals:globals,FS:FS,pyodide_py:pyodide_py,version:"",loadPackage:loadPackage,loadPackagesFromImports:loadPackagesFromImports,loadedPackages:loadedPackages,isPyProxy:isPyProxy,runPython:runPython,runPythonAsync:runPythonAsync,registerJsModule:registerJsModule,unregisterJsModule:unregisterJsModule,setInterruptBuffer:setInterruptBuffer,checkInterrupt:checkInterrupt,toPy:toPy,pyimport:pyimport,unpackArchive:unpackArchive,registerComlink:registerComlink,PythonError:PythonError,PyBuffer:PyBuffer};return namespace._module=Module,Module.public_api=namespace,namespace}Module.runPython=runPython,Module.runPythonAsync=runPythonAsync,Module.saveState=()=>Module.pyodide_py._state.save_state(),Module.restoreState=state=>Module.pyodide_py._state.restore_state(state),Module.dump_traceback=function(){Module.__Py_DumpTraceback(1,Module._PyGILState_GetThisThreadState())};let runPythonInternal_dict,fatal_error_occurred=!1;function finalizeBootstrap(config){runPythonInternal_dict=Module._pyodide._base.eval_code("{}"),Module.importlib=Module.runPythonInternal("import importlib; importlib");let import_module=Module.importlib.import_module;Module.sys=import_module("sys"),Module.sys.path.insert(0,config.homedir);let globals=Module.runPythonInternal("import __main__; __main__.__dict__"),builtins=Module.runPythonInternal("import builtins; builtins.__dict__");var builtins_dict;Module.globals=(builtins_dict=builtins,new Proxy(globals,{get:(target,symbol)=>"get"===symbol?key=>{let result=target.get(key);return void 0===result&&(result=builtins_dict.get(key)),result}:"has"===symbol?key=>target.has(key)||builtins_dict.has(key):Reflect.get(target,symbol)}));let importhook=Module._pyodide._importhook;importhook.register_js_finder(),importhook.register_js_module("js",config.jsglobals);let pyodide=makePublicAPI();return importhook.register_js_module("pyodide_js",pyodide),Module.pyodide_py=import_module("pyodide"),Module.version=Module.pyodide_py.__version__,pyodide.pyodide_py=Module.pyodide_py,pyodide.version=Module.version,pyodide.globals=Module.globals,pyodide}async function loadPyodide(config){if(globalThis.__pyodide_module)throw new Error("Pyodide is already loading.");if(!config.indexURL)throw new Error("Please provide indexURL parameter to loadPyodide");loadPyodide.inProgress=!0,globalThis.__pyodide_module=Module;const default_config={fullStdLib:!0,jsglobals:globalThis,stdin:globalThis.prompt?globalThis.prompt:void 0,homedir:"/home/pyodide"};(config=Object.assign(default_config,config)).indexURL.endsWith("/")||(config.indexURL+="/"),Module.indexURL=config.indexURL;let packageIndexReady=async function(indexURL){let package_json;if(baseURL=indexURL,IN_NODE){const fsPromises=await import("fs/promises"),package_string=await fsPromises.readFile(`${indexURL}packages.json`);package_json=JSON.parse(package_string)}else{let response=await fetch(`${indexURL}packages.json`);package_json=await response.json()}if(!package_json.packages)throw new Error("Loaded packages.json does not contain the expected key 'packages'.");Module.packages=package_json.packages,Module._import_name_to_package_name=new Map;for(let name of Object.keys(Module.packages))for(let import_name of Module.packages[name].imports)Module._import_name_to_package_name.set(import_name,name)}(config.indexURL),pyodide_py_tar_promise=async function(indexURL,path){if(IN_NODE){const fsPromises=await import("fs/promises");return(await fsPromises.readFile(`${indexURL}${path}`)).buffer}{let response=await fetch(`${indexURL}${path}`);return await response.arrayBuffer()}}(config.indexURL,"pyodide_py.tar");var path;setStandardStreams(config.stdin,config.stdout,config.stderr),path=config.homedir,Module.preRun.push((function(){try{Module.FS.mkdirTree(path)}catch(e){console.error(`Error occurred while making a home directory '${path}':`),console.error(e),console.error("Using '/' for a home directory instead"),path="/"}Module.ENV.HOME=path,Module.FS.chdir(path)}));let moduleLoaded=new Promise((r=>Module.postRun=r));const scriptSrc=`${config.indexURL}pyodide.asm.js`;await loadScript(scriptSrc),await _createPyodideModule(Module),await moduleLoaded;!function(pyodide_py_tar){let stream=Module.FS.open("/pyodide_py.tar","w");Module.FS.write(stream,new Uint8Array(pyodide_py_tar),0,pyodide_py_tar.byteLength,void 0,!0),Module.FS.close(stream);const code_ptr=Module.stringToNewUTF8('\nimport shutil\nshutil.unpack_archive("/pyodide_py.tar", "/lib/python3.9/site-packages/")\ndel shutil\nimport importlib\nimportlib.invalidate_caches()\ndel importlib\n    ');if(Module._PyRun_SimpleString(code_ptr))throw new Error("OOPS!");Module._free(code_ptr),Module.FS.unlink("/pyodide_py.tar")}(await pyodide_py_tar_promise),Module._pyodide_init();let pyodide=finalizeBootstrap(config);return await packageIndexReady,config.fullStdLib&&await loadPackage(["distutils"]),pyodide.runPython("print('Python initialization complete')"),pyodide}Module.fatal_error=function(e){if(!e.pyodide_fatal_error){if(fatal_error_occurred)return console.error("Recursive call to fatal_error. Inner error was:"),void console.error(e);e.pyodide_fatal_error=!0,fatal_error_occurred=!0,console.error("Pyodide has suffered a fatal error. Please report this to the Pyodide maintainers."),console.error("The cause of the fatal error was:"),Module.inTestHoist?(console.error(e.toString()),console.error(e.stack)):console.error(e);try{Module.dump_traceback();for(let key of Object.keys(Module.public_api))key.startsWith("_")||"version"===key||Object.defineProperty(Module.public_api,key,{enumerable:!0,configurable:!0,get:()=>{throw new Error("Pyodide already fatally failed and can no longer be used.")}});Module.on_fatal&&Module.on_fatal(e)}catch(err2){console.error("Another error occurred while handling the fatal error:"),console.error(err2)}throw e}},Module.runPythonInternal=function(code){return Module._pyodide._base.eval_code(code,runPythonInternal_dict)},globalThis.loadPyodide=loadPyodide,exports.loadPyodide=loadPyodide,Object.defineProperty(exports,"__esModule",{value:!0})}));`);
  
  
  function addToOutput(output) {
    
    consoleEl.innerHTML += '<div class="message">' + output + '</div>';
    
  }
  
  function clearOutput() {
    
    consoleEl.innerHTML = '';
    
  }
  
  
  addToOutput('Initializing Python...');
  
  // load pyodide in python frame
  pythonFrame.pyodide = await pythonFrame.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.19.0/full/'
  });

  clearOutput();
  
  
  // run file
  
  try {
    
    let output = pythonFrame.pyodide.runPython(decodeUnicode(file.content));
    
    addToOutput(output);
    
  } catch (err) {
    
    addToOutput(err);
    
  }
  
}



async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
