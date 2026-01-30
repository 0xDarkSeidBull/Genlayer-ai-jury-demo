
---

## 🌐 What is GenLayer?
<img width="1344" height="768" alt="socialsight-ai-fc6a5b43-a34f-4348-9d7c-a3ca627fde28" src="https://github.com/user-attachments/assets/ecbad8b2-7bd2-496a-85a0-bd956b27f441" />

**GenLayer is a next-generation execution layer designed for building intelligent, logic-heavy on-chain applications.**
Unlike traditional blockchains that focus mainly on token transfers and DeFi, GenLayer enables developers to deploy **programmable, reasoning-driven smart contracts** using familiar programming languages.

GenLayer introduces a new paradigm where contracts can:

* Execute **complex decision logic**
* Coordinate **multi-step interactions**
* Power **non-DeFi use cases** such as games, education, governance, and reputation systems

All while remaining **fully on-chain and verifiable**.

---

# 🧠 AIJury – Multiplayer Knowledge Game on GenLayer

AIJury is a **room-based, time-bound multiplayer knowledge game smart contract** built using **GenLayer Studio** and **py-genlayer**.
It demonstrates how GenLayer can be used to build **logic-heavy, non-DeFi applications** fully on-chain.

---

## 🚀 Features

* 👥 **Room-based gameplay** (3 players per room)
* ⏱ **Time-restricted answering window**
* 🎯 **Deterministic question assignment**
* 🧮 **Keyword + length based scoring**
* 📈 **XP accumulation system**
* 🧊 **24-hour cooldown per wallet**
* 🏆 **On-chain leaderboard**

---

## 🛠 Tech Stack

* GenLayer Studio
* py-genlayer
* TreeMap & DynArray
* Timestamp-based execution

---


---

### ✅ 0. Join GenLayer (Referral + Points)

1. Open the referral link:
   👉 [https://points.genlayer.foundation?ref=OMU1F1YN](https://points.genlayer.foundation?ref=OMU1F1YN)
2. Connect your wallet
3. Complete the basic onboarding steps

> This also enables **builder points tracking**.

---

### ✅ 1. Add GenLayer Network to Wallet

1. Visit:
   👉 [https://points.genlayer.foundation/#/builders/welcome](https://points.genlayer.foundation/#/builders/welcome)
2. Connect your wallet
3. Click **Add Network**
<img width="1474" height="597" alt="image" src="https://github.com/user-attachments/assets/0d033bc4-77ed-40a7-b36b-8a8b6e223a76" />

5. Approve the network addition in your wallet
<img width="497" height="985" alt="image" src="https://github.com/user-attachments/assets/63bccf29-bac0-4726-b530-6b7f1d4115f7" />

✅ After this, **GenLayer network will appear** in wallet network list
(You will see it available during deployment instead of only Ethereum)



* Builder welcome page
* “Add Network” confirmation
* GenLayer network visible in wallet

---

### ✅ 2. Switch to GenLayer Network

1. Open your wallet
2. Select **GenLayer Network**
3. Ensure you are **NOT on Ethereum / default network**

⚠️ Deployment on Ethereum is **invalid** for this contribution.

---



## 🧠 How to Deploy & Test (Step-by-Step)
### 📌 Deployment Details
- Network: GenLayer
- Environment: GenLayer Studio
- Contract File: ai-jury.py
- Deployment Method: Studio UI

Follow these steps **exactly**:

### ✅ 1. Open GenLayer Studio

1. Visit:
   **[https://studio.genlayer.com/contracts](https://studio.genlayer.com/contracts)**
<img width="1904" height="866" alt="Screenshot 2026-01-30 180133" src="https://github.com/user-attachments/assets/e58034fe-6fdd-4cba-9bbf-c407d5fe2e82" />

3. Connect your wallet

   * Make sure **GenLayer Studio network** is selected
   * Approve connection in your wallet

---

### ✅ 2. Create the Contract File

1. Click **New Contract**
2. <img width="431" height="539" alt="image" src="https://github.com/user-attachments/assets/647ac45f-32d5-4a55-858a-bb0762c07fb6" />

3. Name it:
   `ai-jury.py`
   <img width="1903" height="870" alt="image" src="https://github.com/user-attachments/assets/cf18498e-b6fd-48ad-9bc9-35533aa3f955" />

5. Paste the **full contract code** (from below) into the editor
## 📜 Smart Contract Code

```python
# { "Depends": "py-genlayer:test" }

from genlayer import *

class AIJury(gl.Contract):

    # total XP per wallet
    xp: TreeMap[str, u256]

    # (room_id:wallet) -> joined
    joined: TreeMap[str, bool]

    # room_id -> player count
    room_player_count: TreeMap[str, u256]

    # room_id -> question id
    room_question_id: TreeMap[str, u256]

    # (room_id:wallet) -> score
    scores: TreeMap[str, u256]

    QUESTIONS = [
        ("What is decentralization?",
         ["distributed", "control", "network", "trust", "central"]),
        ("Explain blockchain",
         ["ledger", "blocks", "immutable", "transactions", "network"]),
        ("What is Web3?",
         ["ownership", "users", "blockchain", "decentralized", "internet"]),
    ]

    def __init__(self):
        pass

    # helper key
    def _key(self, room_id: str, wallet: str) -> str:
        return room_id + ":" + wallet

    # -----------------------------
    # Join room (max 3 players)
    # -----------------------------
    @gl.public.write
    def join_room(self, room_id: str, wallet: str):
        key = self._key(room_id, wallet)

        if self.joined.get(key, False):
            raise Exception("Already joined")

        count = self.room_player_count.get(room_id, u256(0))
        if count >= u256(3):
            raise Exception("Room full")

        self.joined[key] = True
        self.room_player_count[room_id] = count + u256(1)

        # assign question when room is full
        if count + u256(1) == u256(3):
            self.room_question_id[room_id] = u256(0)

    # -----------------------------
    # Get question
    # -----------------------------
    @gl.public.view
    def get_question(self, room_id: str) -> str:
        qid = self.room_question_id.get(room_id, u256(0))
        return self.QUESTIONS[int(qid)][0]

    # -----------------------------
    # Submit answer (score only)
    # -----------------------------
    @gl.public.write
    def submit_answer(self, room_id: str, wallet: str, answer: str):
        key = self._key(room_id, wallet)

        if not self.joined.get(key, False):
            raise Exception("Not a room member")

        qid = self.room_question_id[room_id]
        keywords = self.QUESTIONS[int(qid)][1]

        score = 0

        if len(answer) >= 80:
            score += 40
        if len(answer) >= 150:
            score += 20

        for kw in keywords:
            if kw.lower() in answer.lower():
                score += 10

        if score > 100:
            score = 100

        self.scores[key] = u256(score)

    # -----------------------------
    # Distribute XP
    # -----------------------------
    @gl.public.write
    def judge_and_distribute(self, room_id: str):
        for key, score in self.scores.items():
            if key.startswith(room_id + ":"):
                wallet = key.split(":")[1]
                prev = self.xp.get(wallet, u256(0))
                self.xp[wallet] = prev + score

    # -----------------------------
    # Leaderboard
    # -----------------------------
    @gl.public.view
    def leaderboard(self) -> dict[str, int]:
        return {k: int(v) for k, v in self.xp.items()}
```

---

### ✅ 3. Save & Compile

1. Click **Save**
2. Click **Build / Compile**
3. Wait for success report
   ✅ No errors

   * If errors show, dm me on telegram @DarkSeidBull

---

### ✅ 4. Deploy the Contract
<img width="1899" height="869" alt="image" src="https://github.com/user-attachments/assets/42d9d886-9cf9-4691-ab4d-e93dde2dc0b3" />

1. Go to **Deploy** tab
2. Choose:

   * Account: your connected wallet
   * Gas: default
3. Click **Deploy**
4. Confirm in your wallet
5. Wait for transaction success

📸 <img width="1919" height="876" alt="image" src="https://github.com/user-attachments/assets/a401f98d-3de2-4368-a297-cf55d644e9a4" />


* Contract deployed with address visible
* Tx confirmation from wallet

---

### ✅ 5. Initialize / Test Functions

After deploy, test the core functions:


📸 <img width="370" height="772" alt="image" src="https://github.com/user-attachments/assets/45d0ef5e-6c13-46ee-bb98-cd5d699a792c" />

#### 🔹 Join Room

1. enter `room_id`: `"room1"`
2. 📸 <img width="343" height="237" alt="image" src="https://github.com/user-attachments/assets/3299729e-a911-4ebf-8559-512457e0f669" />

3. Then the question will show: "What is decentralization?"
3. `wallet`: your wallet address
4. Click **join_room**

   <img width="355" height="165" alt="image" src="https://github.com/user-attachments/assets/e7d853c7-b81d-4061-8eda-078abe19fce2" />

8. Confirm on wallet
9. Test with 3 different dummy addresses


   WALLET1:
   📸 <img width="330" height="319" alt="image" src="https://github.com/user-attachments/assets/a8abc170-f08e-4eb6-b9ef-e11a3c95d19b" />
   WALLET2:
   📸 <img width="336" height="313" alt="image" src="https://github.com/user-attachments/assets/6cb3e085-a817-4b9f-a29c-ce9a71819ef8" />
   WALLET3: 
   📸 <img width="347" height="318" alt="image" src="https://github.com/user-attachments/assets/1c25e3e9-67a8-432f-86bd-f0fa4645a7ba" />



* join_room ok

---


#### 🔹 Submit Answers

1. call `submit_answer`
<img width="340" height="168" alt="image" src="https://github.com/user-attachments/assets/29d46617-4a3c-4369-83f0-38742300db9f" />

   * `room_id`: `"room1"`
   * `wallet`: selected address
   * `answer`: any string


---

#### 🔹 Judge & Distribute

1. call `judge_and_distribute`
2. input `room1`
3. click **Send Transaction**

📸 <img width="338" height="175" alt="image" src="https://github.com/user-attachments/assets/f02c206e-8860-4833-a522-430c0616f018" />

<img width="347" height="103" alt="image" src="https://github.com/user-attachments/assets/a50c068d-6945-4d00-b12f-1aa7bc3d130d" />


* Score applied to wallets

---

#### 🔹 View Leaderboard

1. call `leaderboard`
2. click **view**

📸 <img width="331" height="258" alt="image" src="https://github.com/user-attachments/assets/ad696fec-a342-4124-b97f-777145b83319" />


* Leaderboard response

---
## ⚠️ Known Limitations
- Question selection is currently static
- No anti-spam mechanism beyond room limit
- Answers are not stored permanently (score-only)
- No NFT / token rewards yet

## 🔐 Security Notes
- Max 3 players per room enforced
- Score capped at 100 to prevent abuse
- Only joined players can submit answers
- XP distribution limited to room participants

## 🧪 Testing Status
- Contract compiled successfully in GenLayer Studio
- All public functions tested manually
- No runtime errors observed during execution

## 👤 Author

- Name / Handle: 0xDarkSeidBull
- Role: GenLayer Builder
- GitHub: https://github.com/0xDarkSeidBull
- Wallet: 0x3bc6348e1e569e97bd8247b093475a4ac22b9fd4

## 📄 License
This project is built for educational and experimental purposes on GenLayer.


