class PadController {
constructor(prefix = "") {
this.prefix = prefix;
this.currentPad = new URLSearchParams(window.location.search).get('pad') || 'PAD1';
document.getElementById('padTitle').textContent = this.currentPad;
this.activeWell = null;
this.init();
}

init() {  
    this.loadWellStatuses();  
    this.setupDelegatedEvents();  
}  

key(type, well = "") {  
    return `${this.prefix}${type}_${this.currentPad}${well ? "_" + well : ""}`;  
}  

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

// Event delegation for all wells (existing + future)  
setupDelegatedEvents() {  
    const menu = document.getElementById('statusMenu');  

    document.body.addEventListener('contextmenu', e => {  
        const card = e.target.closest('.well-card');  
        if (!card) return;  
        e.preventDefault();  
        this.activeWell = card.dataset.well;  
        menu.style.left = e.pageX + 'px';  
        menu.style.top = e.pageY + 'px';  
        menu.classList.add('show');  
    });  

    let touchTimer;  
    document.body.addEventListener('touchstart', e => {  
        const card = e.target.closest('.well-card');  
        if (!card) return;  
        touchTimer = setTimeout(() => {  
            this.activeWell = card.dataset.well;  
            menu.style.left = e.touches[0].pageX + 'px';  
            menu.style.top = e.touches[0].pageY + 'px';  
            menu.classList.add('show');  
        }, 600);  
    });  
    document.body.addEventListener('touchend', () => clearTimeout(touchTimer));  
    document.body.addEventListener('touchmove', () => clearTimeout(touchTimer));  

    document.body.addEventListener('click', e => {  
        const card = e.target.closest('.well-card');  
        if (card) {  
            this.activeWell = card.dataset.well;  
            document.getElementById('sidebarWellName').textContent = this.activeWell + ' Comments';  
            document.getElementById('commentSidebar').classList.add('open');  
            document.getElementById('overlay').classList.add('open');  
            this.renderComments();  
        } else if (!menu.contains(e.target)) {  
            menu.classList.remove('show');  
        }  
    });  

    document.querySelectorAll('.menu-item').forEach(item => {  
        item.addEventListener('click', () => {  
            if (!this.activeWell) return;  
            const status = item.dataset.status;  
            const card = document.querySelector(`[data-well="${this.activeWell}"]`);  
            if (card) {  
                card.dataset.status = status;  
                card.className = `well-card ${status}`;  
                this.saveStatus(this.activeWell, status);  
            }  
            menu.classList.remove('show');  
        });  
    });  

    document.getElementById('overlay').addEventListener('click', () => this.closeSidebar());  
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

addNewWell(name) {  
    const container = document.querySelector('.wells-container');  
    const card = document.createElement('div');  
    card.className = 'well-card normal';  
    card.dataset.well = name;  
    card.innerHTML = `<span>${name}</span>`;  
    container.appendChild(card);  
    this.saveStatus(name, 'normal');  
    // No need to re-bind, delegation handles it  
}  

}

// Modal logic for Add New Well
window.addNewWellModal = () => {
const modal = document.getElementById('addWellModal');
const input = document.getElementById('newWellInput');
modal.style.display = 'flex';
input.value = '';
input.focus();

const closeModal = () => modal.style.display = 'none';  

document.getElementById('cancelAddWell').onclick = closeModal;  
document.getElementById('confirmAddWell').onclick = () => {  
    const name = input.value.trim().toUpperCase();  
    if (!name) { alert("Enter a well name"); return; }  
    window.padController.addNewWell(name);  
    closeModal();  
};  

};
