// js/seller.js
import { db, storage } from './firebase.js';
import { authCheck } from './auth.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref as sref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const el = id => document.getElementById(id);

// state
const state = {
  auth: null,
  saleId: null,
  lotIndex: 0,
  lotTotal: 0
};

export async function initSeller() {
  // wire auth
  el('auth-btn').addEventListener('click', async () => {
    el('auth-msg').textContent = 'Checking…';
    const name = el('auth-name').value.trim();
    const code = el('auth-code').value.trim();
    try {
      const res = await authCheck(name, code);
      if (!res.ok) {
        el('auth-msg').textContent = res.reason === 'expired' ? `Expired ${res.expires}` : 'Invalid credentials';
        return;
      }
      state.auth = res.record;
      showSellerUI();
    } catch (err) {
      console.error(err); el('auth-msg').textContent = 'Authorization failed.';
    }
  });

  el('auth-clear').addEventListener('click', ()=> { el('auth-name').value=''; el('auth-code').value=''; el('auth-msg').textContent=''; });

  el('signout').addEventListener('click', ()=> {
    state.auth = null;
    document.getElementById('seller-ui').classList.add('hidden');
    document.getElementById('auth').classList.remove('hidden');
  });

  // create sale
  el('create-sale-btn').addEventListener('click', async () => {
    el('sale-msg').textContent = 'Creating sale…';
    const business = el('business-name').value.trim();
    const saleName = el('sale-name').value.trim();
    const startLocal = el('start-local').value;
    const endLocal = el('end-local').value;
    if (!business || !saleName || !startLocal || !endLocal) { el('sale-msg').textContent = 'Fill required fields'; return; }

    try {
      let logoUrl = '';
      const logoFile = el('sale-logo').files[0];
      if (logoFile) {
        const path = `sales/logos/${Date.now()}_${logoFile.name}`;
        const ref = sref(storage, path);
        await uploadBytes(ref, logoFile);
        logoUrl = await getDownloadURL(ref);
      }

      const sale = {
        sellerName: state.auth.name,
        businessName: business,
        saleName,
        saleDesc: el('sale-desc').value.trim(),
        logoUrl,
        createdAt: serverTimestamp(),
        startLocal, endLocal,
        startTZ: el('start-tz').value,
        endTZ: el('end-tz').value,
        globalPrices: el('global-prices').value === 'yes',
        globalOpening: parseFloat(el('global-open').value || 0),
        globalIncrement: parseFloat(el('global-inc').value || 0),
        status: 'draft'
      };

      const docRef = await addDoc(collection(db,'sales'), sale);
      state.saleId = docRef.id;
      state.lotIndex = 0;
      state.lotTotal = parseInt(el('num-lots').value,10)||1;

      // show lot builder
      document.getElementById('auth').classList.add('hidden');
      document.getElementById('seller-ui').classList.remove('hidden');
      document.getElementById('create-sale').classList.add('hidden');
      document.getElementById('lot-builder').classList.remove('hidden');
      el('lot-current').textContent = String(state.lotIndex+1);
      el('lot-total').textContent = String(state.lotTotal);
      el('sale-msg').textContent = 'Sale created — add lots.';
      togglePerLotRows();
    } catch (err) {
      console.error(err);
      el('sale-msg').textContent = 'Failed creating sale.';
    }
  });

  el('global-prices').addEventListener('change', togglePerLotRows);

  // save lot
  el('save-lot').addEventListener('click', async (e) => {
    e.preventDefault();
    if (!state.saleId) { el('lot-msg').textContent = 'No active sale'; return; }
    const ear = el('lot-ear').value.trim();
    if (!ear) { el('lot-msg').textContent = 'Ear notch required'; return; }
    el('lot-msg').textContent = 'Saving lot…';
    try {
      let photoUrl = '';
      const photo = el('lot-photo').files[0];
      if (photo) {
        const path = `sales/${state.saleId}/lots/lot${state.lotIndex+1}_${Date.now()}_${photo.name}`;
        const ref = sref(storage, path);
        await uploadBytes(ref, photo);
        photoUrl = await getDownloadURL(ref);
      }
      const lot = {
        saleId: state.saleId,
        lotNumber: state.lotIndex + 1,
        earNotch: ear,
        pedigree: el('lot-pedigree').value.trim(),
        breed: el('lot-breed').value.trim(),
        photoUrl,
        startingBid: el('global-prices').value === 'yes' ? parseFloat(el('global-open').value||0) : parseFloat(el('lot-start').value||0),
        increment: el('global-prices').value === 'yes' ? parseFloat(el('global-inc').value||0) : parseFloat(el('lot-inc').value||0),
        currentBid: null,
        winningBidder: null,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db,'lots'), lot);
      el('lot-msg').textContent = `Saved lot ${lot.lotNumber}`;
      state.lotIndex++;
      if (state.lotIndex >= state.lotTotal) {
        showDashboard();
      } else {
        el('lot-current').textContent = String(state.lotIndex+1);
        clearLotForm();
      }
    } catch(err) {
      console.error(err); el('lot-msg').textContent = 'Failed saving lot';
    }
  });

  el('finish-lots').addEventListener('click', (e)=> { e.preventDefault(); showDashboard(); });

  el('generate-link').addEventListener('click', ()=> {
    if (!state.saleId) return;
    const url = `${location.origin}/biddingform/live.html?saleId=${state.saleId}`;
    el('live-url').textContent = url;
    navigator.clipboard.writeText(url).then(()=> alert('Live link copied'));
  });

  // helpers
  function showSellerUI() {
    document.getElementById('auth').classList.add('hidden');
    document.getElementById('seller-ui').classList.remove('hidden');
    el('welcome').textContent = `Welcome, ${state.auth.name}`;
    el('access-exp').textContent = `Access valid through: ${state.auth.expires}`;
  }

  function togglePerLotRows() {
    const per = el('global-prices').value === 'no';
    el('per-start').style.display = per ? 'block':'none';
    el('per-inc').style.display = per ? 'block':'none';
    document.getElementById('global-pricing').style.display = per ? 'none':'grid';
  }

  async function showDashboard() {
    document.getElementById('lot-builder').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    // fetch sale data and lots
    try {
      // sale
      const q = query(collection(db,'sales'), where('__name__','==', state.saleId));
      const snap = await getDocs(q);
      let saleDoc = null;
      snap.forEach(s=> saleDoc = {id: s.id, ...s.data()});
      if (!saleDoc) return;
      el('dash-title').textContent = `${saleDoc.businessName} — ${saleDoc.saleName}`;
      el('dash-dates').textContent = `${saleDoc.startLocal} ${saleDoc.startTZ} → ${saleDoc.endLocal} ${saleDoc.endTZ}`;

      // lots
      const q2 = query(collection(db,'lots'), where('saleId','==', state.saleId), orderBy('lotNumber'));
      const snap2 = await getDocs(q2);
      const container = el('lots-grid');
      container.innerHTML = '';
      snap2.forEach(l => {
        const d = l.data();
        const card = document.createElement('div');
        card.className = 'lot-card';
        card.innerHTML = `
          <div class="lot-head"><strong>Lot ${d.lotNumber}</strong> <small>${d.earNotch}</small></div>
          <img src="${d.photoUrl || 'assets/placeholder.png'}" />
          <div class="lot-meta">Breed: ${d.breed || ''}</div>
          <div class="lot-foot"><strong>${d.currentBid ? '$'+d.currentBid : 'Starting Bid'}</strong><span class="muted">${d.winningBidder||''}</span></div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error(err);
    }
  }

  function clearLotForm(){
    el('lot-ear').value=''; el('lot-pedigree').value=''; el('lot-breed').value=''; el('lot-photo').value=''; el('lot-start').value=''; el('lot-inc').value='';
    el('lot-msg').textContent='';
  }
}

// run init on DOMLoad
document.addEventListener('DOMContentLoaded', ()=> { if (document.getElementById('auth')) initSeller(); });
