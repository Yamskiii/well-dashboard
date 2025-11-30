class PadController {
    constructor(prefix = "") {
        this.prefix = prefix;
        this.currentPad = new URLSearchParams(window.location.search).get('pad') || 'PAD1';
        document.getElementById('padTitle').textContent = this.currentPad;
        this.activeWell = null;
        this.init();
    }

    init() { this.loadWellStatuses(); this.setupEvents(); }

    key(type, well = "") { return `${this.prefix}${type}_${this.currentPad}${well ? "_" + well : ""}`; }

    loadWellStatuses() {
        const saved = localStorage.getItem(this.key("wellStatus"));
        if (saved) {
            const statuses = JSON.parse(saved);
            document.querySelectorAll('.well-card').forEach(c => {
                const s = statuses[c.dataset.well] || 'normal';
                c.dataset.status = s;
                c.className = `well-card ${s}`;
            });
        }
    }

    saveStatus(well, status) {
        let data = {};
        const saved = localStorage.getItem(this.key("wellStatus"));
        if (saved) data = JSON.parse(saved);
        data[well] = status;
        localStorage.setItem(this.key("wellStatus"), JSON.stringify(data));
    }

    setupEvents() {
        const menu = document.getElementById('statusMenu');
        document.querySelectorAll('.well-card').forEach(card => {
            card.addEventListener('contextmenu', e => {
                e.preventDefault();
                this.activeWell = card.dataset.well;
                menu.style.left = e.pageX + 'px';
                menu.style.top = e.pageY + 'px';
                menu.classList.add('show');
            });
            card.addEventListener('click', e => {
                e.stopPropagation();
                this.activeWell = card.dataset.well;
                document.getElementById('sidebarWellName').textContent = this.activeWell + ' Comments';
                document.getElementById('commentSidebar').classList.add('open');
                document.getElementById('overlay').classList.add('open');
                this.renderComments();
            });
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                if (!this.activeWell) return;
                const status = item.dataset.status;
                const card = document.querySelector(`[data-well="${this.activeWell}"]`);
                card.dataset.status = status;
                card.className = `well-card ${status}`;
                this.saveStatus(this.activeWell, status);
                menu.classList.remove('show');
            });
        });

        document.addEventListener('click', e => {
            if (!menu.contains(e.target)) menu.classList.remove('show');
        });
    }

    closeSidebar() {
        document.getElementById('commentSidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    }

    loadComments(well) { return JSON.parse(localStorage.getItem(this.key("comments", well)) || '[]'); }
    saveComments(well, comments) { localStorage.setItem(this.key("comments", well), JSON.stringify(comments)); }

    renderComments() {
        if (!this.activeWell) return;
        const comments = this.loadComments(this.activeWell);
        const list = document.getElementById('commentsList');
        list.innerHTML = comments.length === 0 ? '<p class="no-comments">No comments yet</p>' : '';
        comments.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `<div class="comment-text">${c.text.replace(/\n/g,'<br>')}</div>
                <div class="comment-meta"><small>${new Date(c.date).toLocaleString()}</small>
                <div><button onclick="padController.editComment(${i})" class="edit-btn">Edit</button>
                <button onclick="padController.deleteComment(${i})" class="delete-btn">Delete</button></div></div>`;
            list.appendChild(div);
        });
    }

    addComment() {
        const text = document.getElementById('newComment').value.trim();
        if (!text || !this.activeWell) return;
        const comments = this.loadComments(this.activeWell);
        comments.push({ text, date: new Date().toISOString() });
        this.saveComments(this.activeWell, comments);
        document.getElementById('newComment').value = '';
        this.renderComments();
    }

    editComment(i) {
        const comments = this.loadComments(this.activeWell);
        const newText = prompt("Edit comment:", comments[i].text);
        if (newText !== null) {
            comments[i].text = newText.trim();
            comments[i].date = new Date().toISOString();
            this.saveComments(this.activeWell, comments);
            this.renderComments();
        }
    }

    deleteComment(i) {
        if (confirm("Delete this comment?")) {
            const comments = this.loadComments(this.activeWell);
            comments.splice(i, 1);
            this.saveComments(this.activeWell, comments);
            this.renderComments();
        }
    }
}