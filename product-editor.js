(function () {
  const editor = document.getElementById('detailEditor');
  const toolbar = document.getElementById('detailToolbar');
  const status = document.getElementById('detailEditorStatus');
  const dialog = document.getElementById('mediaDialog');
  const form = document.getElementById('mediaForm');
  const preview = document.getElementById('detailPreview');
  let savedRange = null, mediaType = 'image';
  const message = text => { status.textContent = ''; if (text) AdminToast.show(text); };
  function remember() {
    const selection = window.getSelection();
    if (selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) savedRange = selection.getRangeAt(0).cloneRange();
  }
  document.addEventListener('selectionchange', remember);
  function restore() {
    editor.focus(); const selection = window.getSelection(); selection.removeAllRanges();
    if (savedRange && editor.contains(savedRange.startContainer)) selection.addRange(savedRange);
    else { const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false); selection.addRange(range); }
  }
  function refresh() {
    editor.querySelectorAll('img,iframe,video').forEach(media=>{
      if(media.parentElement.classList.contains('editor-media'))return;
      const wrapper=document.createElement('div');wrapper.className='editor-media';wrapper.contentEditable='false';
      media.replaceWith(wrapper);wrapper.append(media);
      const remove=document.createElement('button');remove.type='button';remove.className='remove-media';remove.textContent='삭제';remove.setAttribute('aria-label',media.tagName==='IMG'?'상세 이미지 삭제':'상세 영상 삭제');wrapper.append(remove);
    });
    preview.innerHTML = ProductContent.sanitize(editor.innerHTML);
    document.getElementById('detailEmpty').hidden = !!editor.textContent.trim() || !!editor.querySelector('img,iframe,video');
  }
  function insert(html) { restore(); document.execCommand('insertHTML',false,html); remember(); refresh(); message('내용을 추가했습니다. 상품 저장을 눌러 반영해 주세요.'); }
  toolbar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  toolbar.addEventListener('click', e => {
    const button = e.target.closest('button'); if (!button) return;
    if (button.dataset.command) { restore(); document.execCommand(button.dataset.command,false,button.dataset.value || null); remember(); refresh(); }
    if (button.dataset.media) {
      remember(); mediaType = button.dataset.media; form.reset();
      document.getElementById('mediaTitle').textContent = {image:'이미지 삽입',video:'동영상 삽입',link:'링크 삽입'}[mediaType];
      document.getElementById('imageUploadRow').hidden = mediaType !== 'image';
      document.getElementById('mediaAltRow').hidden = mediaType === 'video';
      document.getElementById('mediaAltLabel').textContent = mediaType === 'link' ? '링크에 표시할 텍스트' : '이미지 설명';
      document.getElementById('mediaHelp').textContent = mediaType === 'video' ? 'YouTube·Vimeo 영상 또는 HTTPS MP4·WebM 주소를 입력해 주세요.' : mediaType === 'image' ? '이미지 주소 또는 이미지 파일 중 하나를 선택해 주세요. 파일은 5MB까지 가능합니다.' : 'HTTPS 링크 주소를 입력해 주세요.';
      document.getElementById('mediaError').textContent = ''; dialog.showModal();
    }
  });
  editor.addEventListener('input',refresh);
  editor.addEventListener('click',event=>{const remove=event.target.closest('.remove-media');if(!remove)return;const range=document.createRange();range.selectNode(remove.parentElement);savedRange=range;restore();document.execCommand('delete',false);remember();refresh();message('선택한 미디어를 삭제했습니다.');});
  editor.addEventListener('paste', e => { e.preventDefault(); restore(); document.execCommand('insertText',false,e.clipboardData.getData('text/plain')); refresh(); });
  editor.addEventListener('drop', e => { e.preventDefault(); message('이미지 버튼에서 파일을 선택해 주세요.'); });
  document.getElementById('toggleDetailPreview').onclick = () => {
    const show = preview.hidden; refresh(); preview.hidden = !show; editor.hidden = show;
    toolbar.hidden = show; document.getElementById('detailEmpty').hidden = show || !!editor.textContent.trim() || !!editor.querySelector('img,iframe,video');
    document.getElementById('toggleDetailPreview').textContent = show ? '계속 편집' : '미리보기';
  };
  document.getElementById('expandDetailEditor').onclick = () => {
    const expanded = document.getElementById('productDialog').classList.toggle('editor-expanded');
    document.getElementById('expandDetailEditor').textContent = expanded ? '편집창 축소' : '편집창 확대';
    document.getElementById('expandDetailEditor').setAttribute('aria-expanded',String(expanded));
  };
  document.getElementById('closeMediaDialog').onclick = () => dialog.close();
  dialog.addEventListener('close', () => restore());
  const escape = value => { const el=document.createElement('span');el.textContent=value;return el.innerHTML.replaceAll('"','&quot;'); };
  async function imageFile(file) {
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('JPG, PNG, WebP, GIF 이미지 파일을 선택해 주세요.');
    if (file.size > 5*1024*1024) throw new Error('5MB 이하의 이미지 파일을 선택해 주세요.');
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/webp',.82);
      if (data.length > 1400000) throw new Error('이미지가 너무 큽니다. 더 작은 이미지 파일을 선택해 주세요.');
      return data;
    } finally { bitmap.close(); }
  }
  form.onsubmit = async e => {
    e.preventDefault(); const submit=form.querySelector('[type=submit]');submit.disabled=true;
    try {
      const raw=document.getElementById('mediaUrl').value.trim(), alt=document.getElementById('mediaAlt').value.trim();
      let html;
      if (mediaType === 'image') {
        const file=document.getElementById('mediaFile').files[0];
        const src=file ? await imageFile(file) : ProductContent.url(raw);
        if (!src) throw new Error('이미지 파일을 선택하거나 HTTPS 이미지 주소를 입력해 주세요.');
        html='<p><img src="'+escape(src)+'" alt="'+escape(alt)+'"></p><p><br></p>';
      } else if (mediaType === 'video') {
        const media=ProductContent.video(raw); if (!media) throw new Error('지원하는 영상 주소를 확인해 주세요. YouTube·Vimeo·MP4·WebM을 지원합니다.');
        html=ProductContent.sanitize('<'+media.tag+' src="'+escape(media.src)+'"></'+media.tag+'>')+'<p><br></p>';
      } else {
        const href=ProductContent.url(raw);if (!href) throw new Error('HTTPS 링크 주소를 입력해 주세요.');
        html='<a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+escape(alt || savedRange?.toString() || href)+'</a>';
      }
      dialog.close(); insert(html);
    } catch (error) { document.getElementById('mediaError').textContent=error.message || '이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.'; }
    finally { submit.disabled=false; }
  };
  const coverInput = document.getElementById('coverImageFile');
  const coverValue = document.getElementById('coverImageValue');
  const coverStatus = document.getElementById('coverImageStatus');
  const saveButton = document.getElementById('productSaveButton');
  let coverRequest = 0;
  function showCover(name) {
    const src = ProductContent.url(coverValue.value, true) || 'assets/product-malma-default.png';
    document.getElementById('coverImagePreview').hidden = false;
    document.getElementById('removeCoverImage').hidden = src === 'assets/product-malma-default.png';
    const image = document.getElementById('coverImageThumb');
    if (src) image.src = src; else image.removeAttribute('src');
    document.getElementById('coverImageName').textContent = name || (src === 'assets/product-malma-default.png' ? '기본 말마 이미지' : '등록된 대표 이미지');
  }
  coverInput.addEventListener('change', async () => {
    const file = coverInput.files[0]; if (!file) return;
    const request = ++coverRequest;
    saveButton.disabled = true;
    coverStatus.className = 'form-note'; coverStatus.textContent = '이미지를 준비하고 있습니다…';
    try {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 이미지 파일을 선택해 주세요.');
      const data = await imageFile(file);
      if (request !== coverRequest) return;
      coverValue.value = data; showCover(file.name);
      coverStatus.textContent = ''; AdminToast.show('이미지가 준비되었습니다. 상품 저장을 눌러 반영해 주세요.');
    } catch (error) {
      if (request !== coverRequest) return;
      coverInput.value = ''; coverStatus.className = 'form-error';
      coverStatus.textContent = error.message || '이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.';
    } finally {
      if (request === coverRequest) { saveButton.disabled = false; }
    }
  });
  document.getElementById('removeCoverImage').onclick = () => {
    ++coverRequest; coverValue.value = ''; coverInput.value = ''; saveButton.disabled = false;
    showCover(); coverStatus.className = 'form-note'; coverStatus.textContent = ''; AdminToast.show('대표 이미지를 삭제했습니다. 상품 저장을 눌러 반영해 주세요.');
  };
  window.CoverImage = {
    load(value) {
      ++coverRequest; coverValue.value = value || ''; coverInput.value = ''; saveButton.disabled = false;
      coverStatus.textContent = ''; coverStatus.className = 'form-note'; showCover();
    }
  };
  window.DetailEditor = {
    load(html) {
      savedRange=null;editor.innerHTML=ProductContent.sanitize(html);editor.hidden=false;preview.hidden=true;toolbar.hidden=false;
      document.getElementById('toggleDetailPreview').textContent='미리보기';message('');refresh();
    },
    value() { const html=ProductContent.sanitize(editor.innerHTML);return editor.textContent.trim() || editor.querySelector('img,iframe,video') ? html : ''; }
  };
})();
