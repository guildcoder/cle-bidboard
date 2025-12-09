// js/live.js
import { db } from './firebase.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const el = id => document.getElementById(id);

async function initLive(){
  const params = new URLSearchParams(location.search);
  const saleId = params.get('saleId');
  if (!saleId) {
    el('sale-name').textContent = 'Invalid link';
    return;
  }

  // load sale
  try {
    const sref = doc(db, 'sales', saleId);
    const snap = await getDoc(sref);
    if (!snap.exists()) { el('sale-name').textContent = 'Sale not found'; return; }
    const sale = snap.data();
    el('sale-brand').textContent = sale.businessName || 'Caprock';
    el('sale-name').textContent = sale.saleName || 'Sale';
    el('sale-dates').textContent = `${sale.startLocal} ${sale.startTZ} → ${sale.endLocal} ${sale.endTZ}`;
    el('sale-desc').textContent = sale.saleDesc || '';

    // load lots
    const q = query(collection(db,'lots'), where('saleId','==', saleId), orderBy('lotNumber'));
    const snapLots = await getDocs(q);
    const container = el('lots');
    container.innerHTML = '';
    snapLots.forEach(l => {
      const d = l.data();
      const card = document.createElement('div');
      card.className = 'lot-card';
      card.innerHTML = `
        <div class="lot-head"><strong>Lot ${d.lotNumber}</strong> <small>${d.earNotch}</small></div>
        <img class="lot-photo" src="${d.photoUrl || '../assets/placeholder.png'}" />
        <div class="lot-meta"><div>Breed: ${d.breed || ''}</div><div>Pedigree: ${d.pedigree || ''}</div></div>
        <div class="lot-foot"><strong>${d.currentBid ? '$'+d.currentBid : 'Starting Bid'}</strong><span class="muted">${d.winningBidder||''}</span></div>
      `;
      // enlarge
      card.querySelector('img').addEventListener('click', ()=> openModal(d.photoUrl || '../assets/placeholder.png'));
      container.appendChild(card);
    });

  } catch(err){
    console.error(err);
  }
}

// modal
function openModal(src){
  const modal = el('photo-modal');
  el('photo-enlarge').src = src;
  modal.classList.remove('hidden');
  el('close-photo').addEventListener('click', ()=> modal.classList.add('hidden'));
}

document.addEventListener('DOMContentLoaded', initLive);
