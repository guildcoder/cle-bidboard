// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCquC_ZsPf59yGnlFLzK8Du1mgibvKOK_M",
  authDomain: "biddingapp-a6d8e.firebaseapp.com",
  projectId: "biddingapp-a6d8e",
  storageBucket: "biddingapp-a6d8e.firebasestorage.app",
  messagingSenderId: "870014358891",
  appId: "1:870014358891:web:b74cf577dfd38eff46e82e",
  measurementId: "G-0QWG9DQCLG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- REAL-TIME BIDDING TRANSACTION ---
export async function placeBid(saleId, lotId, bidderName, bidAmount) {
    const lotRef = doc(db, "sales", saleId, "lots", lotId);

    return runTransaction(db, async (transaction) => {
        const lotDoc = await transaction.get(lotRef);

        if (!lotDoc.exists()) {
            throw "Lot does not exist.";
        }

        const data = lotDoc.data();
        const currentBid = data.currentBid || 0;

        if (bidAmount <= currentBid) {
            throw "Bid too low.";
        }

        transaction.update(lotRef, {
            currentBid: bidAmount,
            currentBidder: bidderName,
            lastBidTime: Date.now(),
            bidHistory: arrayUnion({
                bidder: bidderName,
                amount: bidAmount,
                timestamp: Date.now()
            })
        });
    });
}
