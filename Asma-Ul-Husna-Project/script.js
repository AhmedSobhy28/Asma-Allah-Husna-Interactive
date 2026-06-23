document.addEventListener('DOMContentLoaded', () => {
    const audioContainer = document.getElementById('audioNamesContainer');
    const listContainer = document.getElementById('listNamesContainer');
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    const currentNameDisplay = document.getElementById('currentNameDisplay');
    const displayName = document.getElementById('displayName');
    const displayMeaning = document.getElementById('displayMeaning');
    const displayExplanation = document.getElementById('displayExplanation');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view-section');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');

    let activeIndex = -1;

    // --- 1. جلب بيانات التسبيح من التخزين المحلي ---
    const tasbihData = JSON.parse(localStorage.getItem('tasbihCounts')) || {};

    // --- 2. التحكم في الوضع الليلي ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // --- 3. التحكم في حجم الخط ---
    const htmlElement = document.documentElement;
    let currentFontSize = parseInt(localStorage.getItem('siteFontSize')) || 16;
    htmlElement.style.fontSize = `${currentFontSize}px`;

    document.getElementById('fontIncrease').addEventListener('click', () => {
        if(currentFontSize < 24) {
            currentFontSize += 2;
            htmlElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('siteFontSize', currentFontSize);
        }
    });

    document.getElementById('fontDecrease').addEventListener('click', () => {
        if(currentFontSize > 12) {
            currentFontSize -= 2;
            htmlElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('siteFontSize', currentFontSize);
        }
    });

    // --- 4. التحكم في السكرول والـ Compact Mode ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) document.body.classList.add('is-scrolled');
        else document.body.classList.remove('is-scrolled');
    });

    let isUserScrolling = false;
    let scrollTimeout;
    const pauseAutoScroll = () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => { isUserScrolling = false; }, 2500);
    };
    window.addEventListener('wheel', pauseAutoScroll, { passive: true });
    window.addEventListener('touchmove', pauseAutoScroll, { passive: true });

    // --- 5. البحث الفوري الذكي (بدون تشكيل) ---
    const removeTashkeel = (text) => text.replace(/[\u0617-\u061A\u064B-\u0652]/g, "");

    searchInput.addEventListener('input', (e) => {
        const term = removeTashkeel(e.target.value.trim().toLowerCase());
        const allCards = document.querySelectorAll('.name-card, .list-item');
        
        allCards.forEach(card => {
            const textContent = removeTashkeel(card.textContent.toLowerCase());
            if(textContent.includes(term)) {
                card.style.display = ''; // يظهر العنصر
            } else {
                card.style.display = 'none'; // يخفيه
            }
        });
    });

    // --- 6. التبويبات وبناء المحتوى ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.style.display = 'none');
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';

            if(targetId !== 'audioView') {
                audio.pause();
                pauseBtn.style.display = 'none';
                playBtn.style.display = 'inline-block';
            }
        });
    });

    function renderData() {
        const audioFragment = document.createDocumentFragment();
        const listFragment = document.createDocumentFragment();

        asmaUlHusna.forEach((item, index) => {
            let currentCount = tasbihData[item.id] || 0;
            
            // تصميم أزرار التفاعل (التسبيح والمشاركة)
            let actionsHTML = '';
            if(item.id <= 99) {
                actionsHTML = `
                <div class="card-actions">
                    <button class="action-btn tasbih-btn" data-id="${item.id}">📿 تسبيح (<span class="count">${currentCount}</span>)</button>
                    <button class="action-btn share-btn" data-name="${item.name}" data-meaning="${item.meaning}">🔗 شارك</button>
                </div>
                `;
            }

            // كروت الصوت
            const audioCard = document.createElement('div');
            audioCard.className = 'name-card glass';
            audioCard.id = `name-${index}`;
            audioCard.innerHTML = `
                <h2>${item.name}</h2>
                <p class="card-meaning">${item.meaning}</p>
                <p class="card-explanation">${item.explanation}</p>
                ${actionsHTML}
            `;
            audioFragment.appendChild(audioCard);

            // كروت القائمة
            const listItem = document.createElement('div');
            listItem.className = 'list-item glass';
            listItem.innerHTML = `
                <h3>${item.id ? item.id + '.' : ''} ${item.name}</h3>
                <div class="meaning">المعنى: ${item.meaning}</div>
                <div class="explanation">سبب التسمية/التفسير: ${item.explanation}</div>
                ${actionsHTML}
            `;
            listFragment.appendChild(listItem);
        });

        audioContainer.appendChild(audioFragment);
        listContainer.appendChild(listFragment);

        // تفعيل برمجة الأزرار بعد رسمها
        activateInteractionButtons();
    }

    // --- 7. برمجة أزرار التسبيح والمشاركة (نسخة محدثة) ---
    function activateInteractionButtons() {
        // التسبيح
        document.querySelectorAll('.tasbih-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const id = btn.getAttribute('data-id');
                tasbihData[id] = (tasbihData[id] || 0) + 1;
                localStorage.setItem('tasbihCounts', JSON.stringify(tasbihData));
                
                document.querySelectorAll(`.tasbih-btn[data-id="${id}"] .count`).forEach(span => {
                    span.textContent = tasbihData[id];
                });
            });
        });

        // المشاركة (تم تحديث اللوجيك لضمان العمل في كل الحالات)
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                const meaning = btn.getAttribute('data-meaning');
                const textToShare = `اسم الله: ${name}\nالمعنى: ${meaning}\n\n*تم النسخ من موقع أسماء الله الحسنى*`;
                
                // محاولة استخدام خاصية المشاركة الأصلية
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'أسماء الله الحسنى', text: textToShare });
                    } catch (err) {
                        // لو المستخدم رفض المشاركة أو حصل خطأ، بننفذ النسخ للـ Clipboard
                        copyToClipboard(btn, textToShare);
                    }
                } else {
                    // لو المتصفح مش بيدعمها أصلاً، بنفذ النسخ للـ Clipboard
                    copyToClipboard(btn, textToShare);
                }
            });
        });
    }

    // دالة مساعدة لنسخ النص
    function copyToClipboard(btn, text) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ تم النسخ';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }).catch(err => {
            alert('تعذر النسخ، يرجى التحقق من صلاحيات المتصفح');
        });
    }
    // --- 8. التحكم في الصوت والتزامن ---
    playBtn.addEventListener('click', () => {
        audio.play();
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    });

    pauseBtn.addEventListener('click', () => {
        audio.pause();
        pauseBtn.style.display = 'none';
        playBtn.style.display = 'inline-block';
    });

    audio.addEventListener('ended', () => {
        pauseBtn.style.display = 'none';
        playBtn.style.display = 'inline-block';
    });

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        const newActiveIndex = asmaUlHusna.findLastIndex(item => currentTime >= item.time);

        if (newActiveIndex !== activeIndex && newActiveIndex !== -1) {
            currentNameDisplay.style.display = 'block';
            displayName.textContent = asmaUlHusna[newActiveIndex].name;
            displayMeaning.textContent = asmaUlHusna[newActiveIndex].meaning;
            displayExplanation.textContent = asmaUlHusna[newActiveIndex].explanation;

            document.querySelectorAll('#audioNamesContainer .name-card').forEach(card => card.classList.remove('active'));

            for (let i = 0; i <= newActiveIndex; i++) {
                const card = document.getElementById(`name-${i}`);
                if (card) card.classList.add('shown');
            }
            
            const activeCard = document.getElementById(`name-${newActiveIndex}`);
            if (activeCard) {
                activeCard.classList.add('active');
                if (!isUserScrolling) {
                    const header = document.getElementById('mainHeader');
                    const headerHeight = header ? header.offsetHeight : 0;
                    const displayHeight = currentNameDisplay.offsetHeight;
                    const totalStickyHeight = headerHeight + displayHeight + 40; 
                    const cardPosition = activeCard.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: cardPosition - totalStickyHeight, behavior: 'smooth' });
                }
            }
            activeIndex = newActiveIndex;
        }
    });

    renderData();
});