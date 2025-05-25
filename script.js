const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');

// Oyunda kullanılacak SABİTLER

// ses dosyaları
const bgMusic = new Audio("assets/sounds/restaurant-crowd.mp3");
bgMusic.loop = true; 
bgMusic.volume = 0.3; 

document.addEventListener("click", () => {
    bgMusic.play();
});
const wrongSound = new Audio("assets/sounds/beep_buzzer.wav");

canvasWidth = 800;
canvasHeight = 500; 
SCORE_AREA = 150;
// Kart boyutları
const CARD_WIDTH = 80;
const CARD_HEIGHT = 60;

const COLORS = {
    background: "#f5f5f5",
    topSection: "#e0e0e0",
    middleSection: "#f0f0f0",
    bottomSection: "#e8e8e8",
    text: "#333333",
};

// Oyun canvası temel olarak 3 bölüme ayrıldı: Notlar ksımı, siparişler ve tezgah
const SECTION_HEIGHTS = {
    top: 0.15,
    middle: 0.60,
    bottom: 0.25
};


// Class tanımlamaları
class Ingredient {
    constructor(name, emoji) {
        this.name = name;
        this.emoji = emoji;
    }
}

class GameNumClass {
    constructor(gameNumber, realNumber) {
        this.gameNumber = gameNumber;
        this.realNumber = realNumber;
    }
}

class IngredientCard {
    constructor(ingredient, x, y, width, height) {
        this.ingredient = ingredient;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        // Malzeme arka plan dikdörtgeni
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Malzeme sınırları için kenarlık
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Emoji çizimi
        ctx.font = `${Math.min(this.width, this.height) * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            this.ingredient.emoji, 
            this.x + this.width / 2, 
            this.y + this.height / 3
        );
    }
    
    isUnderMouse(mouseX, mouseY) {
        return mouseX >= this.x &&
               mouseX <= this.x + this.width &&
               mouseY >= this.y &&
               mouseY <= this.y + this.height;
    }
}

class NoteCard {
    constructor(ingredient, x, y, zIndex) {
        this.ingredient = ingredient;
        this.x = x;
        this.y = y;
        this.zIndex = zIndex;
        this.width = CARD_WIDTH;
        this.height = CARD_HEIGHT;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    draw(ctx) {
        // Kart arka planı
        ctx.fillStyle = this.isDragging ? "#fff8dc" : "#ffffff";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Kart kenarlığı
        ctx.strokeStyle = this.isDragging ? "#ff6b6b" : "#cccccc";
        ctx.lineWidth = this.isDragging ? 2 : 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Malzeme ismini üstte yaz
        ctx.font = "10px Arial";
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        ctx.fillText(
            this.ingredient.name ?? this.ingredient.gameNumber,
            this.x + this.width / 2,
            this.y + 5
        );
        
        // Emoji'yi altta çiz
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            this.ingredient.emoji ?? this.ingredient.realNumber,
            this.x + this.width / 2,
            this.y + this.height - 20
        );
    }
    
    isUnderMouse(mouseX, mouseY) {
        return mouseX >= this.x &&
               mouseX <= this.x + this.width &&
               mouseY >= this.y &&
               mouseY <= this.y + this.height;
    }
    
    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        this.offsetX = mouseX - this.x;
        this.offsetY = mouseY - this.y;
    }
    
    drag(mouseX, mouseY) {
        if (this.isDragging) {
            // Yeni pozisyonlar
            let newX = mouseX - this.offsetX;
            let newY = mouseY - this.offsetY;
            
            // Notlar kısmının sınırları
            const minX = SCORE_AREA;
            const maxX = canvasWidth - this.width;
            const minY = 0;
            const maxY = canvasHeight * SECTION_HEIGHTS.top - this.height;
            
            // daha sağdaysa bile en fazla maxX kadar sağa gidebilir
            // daha soldaysa bile en an minX kadar solda kalabilir
            this.x = Math.max(minX, Math.min(maxX, newX));
            this.y = Math.max(minY, Math.min(maxY, newY));
        }
    }
    
    stopDrag() {
        this.isDragging = false;
    }
}

class Order {
    constructor(x, y, width, height, context, ingredientList, color="#fff8e1", timeLimit=25) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.context = context // Yazı kısmı
        this.ingredients = ingredientList; // Siparişteki malzemeler
        this.receivedIngredients = []; // Alınan malzemeler
        this.isCompleted = false;
        this.isWaiting = false;

        this.timeLimit = timeLimit; // Saniye cinsinden süre limiti
        this.remainingTime = timeLimit; // Kalan süre
        this.lastUpdateTime = Date.now(); // Son güncelleme zamanı
        this.isExpired = false; // Süre doldu mu?

        this.isShaking = false;       // Shake animasyonu aktif mi?
        this.shakeOffset = 0;        // Offset değeri
        this.shakeDirection = 1;      // Sağa/sola hareket yönü
        this.shakeIntensity = 10;     // Titreşim şiddeti
        this.shakeDuration = 20;      // Animasyon süresi (frame sayısı)
        this.currentShakeFrame = 0;   // Şu anki frame
    }
    
    draw(ctx) {
        // Şimdilik basit sipariş kutusu
        let backgroundColor = this.color;
        
        if (this.isCompleted) {
            backgroundColor = "#c8e6c9";
        } else if (this.isShaking) {
            backgroundColor = "#ffcdd2";
        } else if (this.remainingTime <= 5) {
            // Son 5 saniyede kırmızılaş
            backgroundColor = "#ffcdd2";
        } else if (this.remainingTime <= 10) {
            // Son 10 saniyede sarılaş
            backgroundColor = "#fff3cd";
        }
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(this.x+this.shakeOffset, this.y, this.width, this.height);
        
        const borderColor = this.isCompleted ? "#4caf50" : "#ffb74d";
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x+this.shakeOffset, this.y, this.width, this.height);
        
        // Kalan süreyi sol üst köşede göster
        this.drawRemainingTime(ctx);


        // Sipariş malzemelerinin yazılması ksımı
        ctx.font = "12px Arial";
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            this.context,
            this.x+this.shakeOffset + this.width / 2,
            this.y + this.height / 2
        );
    }

    drawRemainingTime(ctx) {
        if (this.isCompleted) return;
        
        // Timer arka planı
        const timerWidth = 50;
        const timerHeight = 30;
        const timerX = this.x + this.shakeOffset + 5;
        const timerY = this.y + 5;
        
        // Arka plan rengi - süreye göre değişir
        let timerBgColor = "#4caf50"; // Yeşil
        if (this.remainingTime <= 5) {
            timerBgColor = "#f44336"; // Kırmızı
        } else if (this.remainingTime <= 10) {
            timerBgColor = "#ff9800"; // Turuncu
        }
        
        ctx.fillStyle = timerBgColor;
        ctx.fillRect(timerX, timerY, timerWidth, timerHeight);
        
        // Timer border
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(timerX, timerY, timerWidth, timerHeight);
        
        // Süre yazısı
        ctx.font = "20px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const timeText = Math.max(0, Math.ceil(this.remainingTime)).toString();
        ctx.fillText(
            timeText,
            timerX + timerWidth / 2,
            timerY + timerHeight / 2
        );
    }

    updateTimer() {
        if (this.isCompleted || this.isExpired) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Saniye cinsinden
        
        this.remainingTime -= deltaTime;
        this.lastUpdateTime = currentTime;
        
        // Süre kontrolü
        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.isExpired = true;
        }
        
    
    }
    
    isUnderMouse(mouseX, mouseY) {
        return mouseX >= this.x &&
               mouseX <= this.x + this.width &&
               mouseY >= this.y &&
               mouseY <= this.y + this.height;
    }
    
    canAcceptIngredient(ingredient) {
        // Sipariş tamamlandıysa kabul etme
        if (this.isCompleted) {
            return false;
        }
        
        // Malzeme sipariş listesinde yok
        if (!this.ingredients.includes(ingredient.name)) {
            return false;
        }
        
        // Miktar kontrolü
        const requiredCount = this.ingredients.filter(ing => ing === ingredient.name).length;
        const receivedCount = this.receivedIngredients.filter(ing => ing === ingredient.name).length;
        
        return receivedCount < requiredCount;
    }
    
    receiveIngredient(ingredient) {
        this.receivedIngredients.push(ingredient.name);
        
        // Sipariş tamamlandı mı
        this.checkIfCompleted();
    }

    checkIfCompleted() {
        // Malzeme kontrolü
        const sortedRequired = [...this.ingredients].sort();
        const sortedReceived = [...this.receivedIngredients].sort();
        
        if (sortedRequired.length === sortedReceived.length) {
            this.isCompleted = sortedRequired.every((ingredient, index) => 
                ingredient === sortedReceived[index]
            );
        }
        
        if (this.isCompleted) {
            console.log("Sipariş tamamlandı! ");
            this.color = "#c8e6c9"; // Yeşil renk - tamamland
            score += 10;
            // SIMDILIK SES EFEKTİ YOJK
        }
    }

    shakeOrder() {
        if (!this.isShaking) {
            this.isShaking = true;
            this.currentShakeFrame = 0;
        }
    }

    updateFrame() {
        if (this.isShaking) {
            // Shake animasyonu devam ediyor
            this.currentShakeFrame++;
            
            // Sinüs fonksiyonu ile smooth hareket
            this.shakeOffset = Math.sin(this.currentShakeFrame * 0.3 * Math.PI) * this.shakeIntensity;
            
            // Animasyon bittiğinde sıfırla
            if (this.currentShakeFrame >= this.shakeDuration) {
                this.isShaking = false;
                this.shakeOffset = 0;
            }
        }
    }
        
}

class DraggedItem {
    constructor(ingredient, mouseX, mouseY) {
        this.ingredient = ingredient;
        this.x = mouseX - 25; // Yarı genişlik kadar offset
        this.y = mouseY - 25; // Yarı yükseklik kadar offset
        this.width = 50;
        this.height = 50;
    }
    
    updatePosition(mouseX, mouseY) {
        this.x = mouseX - 25;
        this.y = mouseY - 25;
    }
    
    draw(ctx) {
        // Semi-transparent arka plan
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Kenarlık
        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Emoji
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#333";
        ctx.fillText(
            this.ingredient.emoji,
            this.x + this.width / 2,
            this.y + this.height / 2
        );
    }
}

// Kullanılacak Tüm malzemeler
// Şimdilik emojilerle başlasın
const fullIngredientList = [
    new Ingredient('Ekmek', '🥖'),
    new Ingredient('Köfte', '🥓'),
    new Ingredient('Domates', '🍅'),
    new Ingredient('Marul', '🥬'),
    new Ingredient('Soğan', '🧄'),
    new Ingredient('Turşu', '🥒'),
];
// Her oyun başladığında malzemeler yeniden eşlenecek ve bu listede tutulacak
let randomGameIngredients = [];
let randomNumbers = []
let currentIngredients = []; // bu liste oyun zorlaştıkça dolacak

// Oyun kontrol değişkenleri
let score = 0;
let lives = 3;
let gameStarted = false;
let gameOver = false;

// Zaman ve zorluk sistemi için değişkenler
let gameStartTime = 0; // Şimdilik zaman tabanlı zorluk
let nextIngredientIndex = 1; // Sıradaki malzemenin indeksi
//const SCORE_PER_SECOND = 1; // Saniyede 1 puan
const SCORE_THRESHOLDS = [10, 20, 30, 40, 50]; // Her malzeme için gerekli skorlar
let difficulty = 0;

// Not kartları için gerekli değişkenler
let noteCards = [];
let nextZIndex = 1;

// Tezgah malzemeleri ve siparişler
let ingredientCards = [];
let orders = [];
let draggedItem = null; // Şu anda sürüklenen malzeme


// Oyunu baslatacak fonksiyon
function init(){
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    gameStarted = true;
    gameStartTime = Date.now();
    score = 0;
    lives = 3;
    randomGameIngredients = [];
    randomNumbers = [];
    currentIngredients = [];
    orders = [];
    difficulty = 0;
    noteCards = [];
    nextZIndex = 1;
    ingredientCards = [];
    nextIngredientIndex = 1;
    randomIngredientsMatch();
    randomNumbersMatch();
    createNewOrder();
        createNewOrder();

            createNewOrder();
    setupMouseEvents();

    draw();
}



function randomIngredientsMatch(){
    const n = fullIngredientList.length;
    // malzemeler rastgele eşlenmeye çalışılacak
    // sona kalan malzeme kendisiyle eşlenirse eşleştirmeye yeniden başlanacak
    // while döngüsü içinde eşleşme başarılı olana kadar dönülecek
    let flag = false;

    while (!flag) {
        const availableIndices = [...Array(n).keys()];  // kalan indislerin kopyalanması
        const mapping = [];

        flag = true; // başta başarılı varsay

        for (let i = 0; i < n; i++) {
            // Kendisi dışındaki indeksleri filtrele
            const candidates = availableIndices.filter(index => index !== i);
            
            // Sona kendi indisi kalmış ve çıkarılmışsa
            if (candidates.length === 0) {
                flag = false; // başa sar
                break;
            }

            const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
            availableIndices.splice(availableIndices.indexOf(randomIndex), 1); // Seçilen indeksi çıkar
            mapping[i] = randomIndex;
        }

        // Eşleşme başarılı
        if (flag) {
            randomGameIngredients = fullIngredientList.map((item, i) => {
                const mappedItem = fullIngredientList[mapping[i]];
                return new Ingredient(mappedItem.name, item.emoji);
            });
        }
    }

    console.log(randomGameIngredients)
    bread = randomGameIngredients[0];
    // current'i bread'le başlat
    currentIngredients[0] = bread;
    console.log(currentIngredients);
    // ilk notu da ekle
    addNewNoteCard(bread);
}

function randomNumbersMatch(){
    const randomReasonableNumbers = [1, 2, 3];
    const numberList = [...Array(15).keys()].slice(1); // [1,2,3...20]
    
    // 17 sayı çıkar, geriye 3 tane kalsın
    while (numberList.length > 3) {
        const randomIndex = Math.floor(Math.random() * numberList.length);
        numberList.splice(randomIndex, 1);
    }
    
    // Kalan 3 sayıyı karıştırılmış 1,2,3 ile eşleştir
    const shuffledReasonableNumbers = [...randomReasonableNumbers].sort(() => Math.random() - 0.5);
    
    // Eğer aynı sayılar eşleşiyorsa tekrar karıştır
    while (numberList.some((num, i) => num === shuffledReasonableNumbers[i])) {
        shuffledReasonableNumbers.sort(() => Math.random() - 0.5);
    }
    
    // Number objelerinden oluşan liste oluştur
    for (let i = 0; i < 3; i++) {
        randomNumbers.push(new GameNumClass(numberList[i], shuffledReasonableNumbers[i]));
    }
    
    console.log('Kalan sayılar:', numberList);
    console.log('randomNumbers listesi:', randomNumbers);
}

// Oyun döngüsü
function draw(){
    //canvasın temizlenmesi
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);  

    if(gameStarted == false){
        drawStartScreen();
    }
    else if(gameOver == true){
        drawGameOverScreen();
    }
    else{
        // Oyun devam ediyor
        if(lives===0) gameOver = true;
        drawSections();
        updateGameProgression();
        drawCurrentIngredients();
        drawOrders();
        drawScore();
        drawNotes();
        drawDraggedItem();
    }

    // Oyun döngüsü
    requestAnimationFrame(draw);
}

function drawStartScreen(){

}

function drawGameOverScreen() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvasWidth / 2, canvasHeight / 3);
    
    ctx.font = "24px Arial";
    ctx.fillText(`Final Score: ${score}`, canvasWidth / 2, canvasHeight / 2);
    
    // Restart butonu (dikdörtgen ve metin)
    const restartButton = {
        x: canvasWidth / 2 - 150,  // Buton genişliği 300px (yarısı 150)
        y: canvasHeight * 2/3,
        width: 300,
        height: 40,
    };
    
    // Buton çizimi
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    
    ctx.font = "20px Arial";
    ctx.fillText("Click to play again", canvasWidth / 2, restartButton.y + 25);
    
    // Buton bilgisini global olarak sakla (mouse tıklamasında kontrol için)
    window.restartButton = restartButton;
    
    ctx.textAlign = "left";
}

// not-siparişler-tezgah kısımlarının çizilmesi
function drawSections(){
    // not kısmı
    ctx.fillStyle = COLORS.topSection;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight * SECTION_HEIGHTS.top);
    
    // siparisler kısmı
    ctx.fillStyle = COLORS.middleSection;
    ctx.fillRect(0, canvasHeight * SECTION_HEIGHTS.top, 
                canvasWidth, canvasHeight * SECTION_HEIGHTS.middle);
    
    // tezgah kısmı
    ctx.fillStyle = COLORS.bottomSection;
    ctx.fillRect(0, canvasHeight * (SECTION_HEIGHTS.top + SECTION_HEIGHTS.middle), 
                canvasWidth, canvasHeight * SECTION_HEIGHTS.bottom);
    
    // bölümlerin ayrılması
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight * SECTION_HEIGHTS.top);
    ctx.lineTo(canvasWidth, canvasHeight * SECTION_HEIGHTS.top);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight * (SECTION_HEIGHTS.top + SECTION_HEIGHTS.middle));
    ctx.lineTo(canvasWidth, canvasHeight * (SECTION_HEIGHTS.top + SECTION_HEIGHTS.middle));
    ctx.stroke();
}

// tezgahtaki malzemelerin çizilmesi
function drawCurrentIngredients(){
    // Tezgah bölümünün başlangıç y koordinatı
    const bottomSectionY = canvasHeight * (SECTION_HEIGHTS.top + SECTION_HEIGHTS.middle);
    
    // Tezgah yüksekliği
    const bottomSectionHeight = canvasHeight * SECTION_HEIGHTS.bottom;
    
    // Her malzeme için ayrılacak maksimum alan boyutları
    const maxItemsPerRow = 6; // Bir satırda en fazla 6 malzeme
    const itemWidth = canvasWidth / maxItemsPerRow;
    const itemHeight = bottomSectionHeight / Math.ceil(currentIngredients.length / maxItemsPerRow);
    
    // Grid yapısı için padding
    const padding = 10;
    
    // IngredientCard nesnelerini oluştur
    if (ingredientCards.length !== currentIngredients.length) {
        ingredientCards = [];
        currentIngredients.forEach((ingredient, index) => {
            // Grid pozisyonu hesaplama
            const row = Math.floor(index / maxItemsPerRow);
            const col = index % maxItemsPerRow;
            
            // Malzemenin çizileceği x,y koordinatları
            const x = col * itemWidth + padding;
            const y = bottomSectionY + row * itemHeight + padding;
            
            const ingredientCard = new IngredientCard(
                ingredient, 
                x, 
                y, 
                itemWidth - padding * 2, 
                itemHeight - padding * 2
            );
            
            ingredientCards.push(ingredientCard);
        });
    }
    
    // IngredientCard nesnelerini çiz
    ingredientCards.forEach(ingredientCard => {
        ingredientCard.draw(ctx);
    });
}

// Sürüklenen malzemeyi çiz
function drawDraggedItem() {
    if (draggedItem) {
        draggedItem.draw(ctx);
    }
}

// Skoru çiz
function drawScore() {
    // Top section'ın sol üst köşesi
    const topSectionY = 0;
    const topSectionHeight = canvasHeight * SECTION_HEIGHTS.top;
    
    // Skor arka planı
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(10, 10, 120, 30);
    
    // Skor kenarlığı
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 120, 30);
    
    // Skor metni
    ctx.font = "16px Arial";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
        `Skor: ${score}`, 
        15, 
        25
    );

    // Kalan canlar
    ctx.font = "16px Arial";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
        `Lives: ${lives}`, 
        15, 
        55
    );
}


function drawNotes(){
    // Kartları z-index'e göre sırala (alttakiler önce çizilsin)
    const sortedCards = [...noteCards].sort((a, b) => a.zIndex - b.zIndex);
    
    // Her kartın kendi draw metodunu çağır
    sortedCards.forEach(card => {
        card.draw(ctx);
    });
}


// Yeni not kartı ekle
function addNewNoteCard(ingredient) {
    // Notlar kısmında rastgele bir konuma (top section-scroe table içinde)
    const x = Math.random() * (canvasWidth - SCORE_AREA - CARD_WIDTH) + SCORE_AREA;
    const y = Math.random() * (canvasHeight * SECTION_HEIGHTS.top - CARD_HEIGHT);
    
    const newCard = new NoteCard(ingredient, x, y, nextZIndex++);
    noteCards.push(newCard);
}


// Oyunun zorlaştırılması
function updateGameProgression() {
    // Simdilik zaman tabanlı skor
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameStartTime;
    
    // Skoru güncelle (saniye başına 1 puan)
    //score = Math.floor(elapsedTime / 1000) * SCORE_PER_SECOND;
    
    // Skor eşiğine göre yeni malzeme ekleme kontrolü
    checkForNewIngredient();

    // Skora göre zorluk belirleme
    if(score<SCORE_THRESHOLDS[difficulty]){
        difficulty = 0;
    }
    else if (score>=SCORE_THRESHOLDS[difficulty]){
        difficulty++;
    }

    
}

/*
function checkForNewIngredient() {
    //Eklenecek malzeme var mı
    if (nextIngredientIndex < randomGameIngredients.length) {
        const thresholdIndex = nextIngredientIndex - 1; // İlk malzeme için eşik yok
    
        // eklenecek zorluk var mı ve score bir sonraki zorluk thresholduna geldi mi
        if (thresholdIndex < SCORE_THRESHOLDS.length && 
            score >= SCORE_THRESHOLDS[thresholdIndex]) {
            
            //addNextIngredient();
            //nextIngredientIndex++;
        
            
        
        if (difficulty === 0){
            console.log("dif"+difficulty);
            addNextIngredient();
            nextIngredientIndex++;
        }
        else if(difficulty ===1){
            console.log("dif"+difficulty);
            addNextIngredient();
            nextIngredientIndex++;
        }
        else if (difficulty === 2){
            console.log("dif"+difficulty);
            addNewNoteCard(randomNumbers[0]);
        }
        }
    }
}
    */

function checkForNewIngredient(){

}

// Sıradaki malzemeyi current'e ekle
function addNextIngredient() {
    if (currentIngredients.length < randomGameIngredients.length) {
        const nextIngredient = randomGameIngredients[currentIngredients.length];
        currentIngredients.push(nextIngredient);
        
        // Yeni kart ekle
        addNewNoteCard(nextIngredient);
        
        console.log(`Yeni malzeme eklendi: ${nextIngredient.name} (${nextIngredient.emoji}) - Skor: ${score}`);
        console.log(`Toplam malzeme sayısı: ${currentIngredients.length}`);
    }
}

/// SİPARİŞ TİPLERİ
function orderType0(){
    // item

    // currentIngredients'ten rastgele bir eleman seç
    let itemIndex = Math.floor(Math.random()* currentIngredients.length);
    let item = currentIngredients[itemIndex];
    
    // elemanın ismini context olarak döndür
    let context = `${item.name}`;

    // elemanın ismini ingredientList içinde döndür
    let ingredientList = [item.name];

    return {context, ingredientList};
}

function orderType1(){
    // item
    // item
    let context = '';
    let ingredientList = [];
    let availableIngredients = [...currentIngredients];

    for(let i=0; i<2; i++){
        // copyalanan listeden rastgele bir eleman seç
        let itemIndex = Math.floor(Math.random()* availableIngredients.length);
        let item = availableIngredients[itemIndex];
        
        // elemanın ismini context olarak döndür
        context += `${item.name} `;
        // elemanın ismini ingredientList içinde döndür
        ingredientList.push(item.name);
        availableIngredients.splice(itemIndex, 1);
    }
    context = context.trim();
    return { context, ingredientList};
}

function orderType2(){
    // item
    // item
    // item
    let context = '';
    let ingredientList = [];
    let availableIngredients = [...currentIngredients];

    for(let i = 0; i < 3; i++){
        let itemIndex = Math.floor(Math.random() * availableIngredients.length);
        let item = availableIngredients[itemIndex];

        context += `${item.name} `;
        ingredientList.push(item.name);
        availableIngredients.splice(itemIndex, 1);

    }

    context = context.trim();
    return { context, ingredientList};
}

function orderType3(){
    // num item
    // num item
    let context = '';
    let ingredientList = [];
    let availableIngredients = [...currentIngredients];

    for(let i = 0; i < 2; i++){
        let itemIndex = Math.floor(Math.random() * availableIngredients.length);
        let item = availableIngredients[itemIndex];
        //let numberIndex = Math.floor(Math.random() * randomNumbers.length);

        //let myNumber = randomNumbers[numberIndex];
        let myNumber = randomNumbers[0];

        context += `${myNumber.gameNumber} ${item.name} `;

        for(let i=0; i<myNumber.realNumber; i++){
            
            ingredientList.push(item.name);
        }

        availableIngredients.splice(itemIndex, 1);
    }

    context = context.trim();

    return { context, ingredientList};
}

function createOrderContent(){
    let context, ingredientList;
    let randomNum = Math.floor(Math.random() * 3);  // 0-2


    if(difficulty === 0){
        return orderType0();
    }

    else if(difficulty === 1){
        return randomNum === 0 ? orderType0() : orderType1();
    }

    else if(difficulty === 2){
        if(randomNum === 0) return orderType0();
        if(randomNum === 1) return orderType1();
        return orderType2();
    }
    else if(difficulty===3){
        console.log("difficulty"+difficulty);
        return orderType3();
    }

    // SIMDILIK SON DURUM TEKRARLANIYOR
    else
        {console.log("diFFFFFFFfficulty"+difficulty);
        return orderType3();    
    }

}

function createNewOrder() {
    const orderWidth = 200;
    const orderHeight = 240;
    const orderSpacing = 50;
    const middleSectionY = canvasHeight * SECTION_HEIGHTS.top;
    
    // Boş yer bul
    for (let i = 0; i < 3; i++) {
        const x = orderSpacing + i * (orderWidth + orderSpacing);
        const y = middleSectionY + 30;
        
        // Bu pozisyonda sipariş var mı?
        const existingOrder = orders.find(o => 
            Math.abs(o.x - x) < 10 && Math.abs(o.y - y) < 10
        );
        
        if (!existingOrder) {
            let {context, ingredientList} = createOrderContent();
            orders.push(new Order(x, y, orderWidth, orderHeight, context, ingredientList));
            break;
        }
    }
}

// Siparişlerin çizilmesi
function drawOrders() {
    // Middle section boundaries
    const middleSectionY = canvasHeight * SECTION_HEIGHTS.top;
    const middleSectionHeight = canvasHeight * SECTION_HEIGHTS.middle;

    // Tamamlanan orderların çıkarılması
    orders.forEach(order => {
        if (order.isCompleted && !order.isWaiting) {
            order.isWaiting = true;

            setTimeout(() => {
                const index = orders.indexOf(order);
                if (index > -1) {
                    orders.splice(index, 1);
                    createNewOrder();
                }
            }, 1000);
        }
    });

     // Süresi dolan siparişleri kontrol et ve sil
    for (let i = orders.length - 1; i >= 0; i--) {
        const order = orders[i];
        
        // Süre kontrolü yap
        order.updateTimer();
        
        // Süre dolmuşsa sipariş sil ve can azalt
        if (order.isExpired && !order.isCompleted) {
            console.log("Sipariş süresi doldu! Can kaybedildi.");
            orders.splice(i, 1);
            lives--; 
            createNewOrder();
        }
    }

    // Siparişleri çiz
    orders.forEach(order => {
        order.updateFrame();
        order.draw(ctx);
    });
}



// Mouse event listener'ları ekle
function setupMouseEvents() {
    cvs.addEventListener('mousedown', handleMouseDown);
    cvs.addEventListener('mousemove', handleMouseMove);
    cvs.addEventListener('mouseup', handleMouseUp);
}

function handleMouseDown(e){
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Önce tezgahtaki malzemeleri kontrol et
    for (let ingredientCard of ingredientCards) {
        if (ingredientCard.isUnderMouse(mouseX, mouseY)) {
            // Malzemeyi sürüklemeye başla
            draggedItem = new DraggedItem(ingredientCard.ingredient, mouseX, mouseY);
            return;
        }
    }
    
    // Sonra not kartlarını kontrol et
    // En üstteki (en yüksek z-index) kartı bul
    let topCard = null;
    let maxZIndex = -1;
    
    noteCards.forEach(card => {
        if (card.isUnderMouse(mouseX, mouseY) && card.zIndex > maxZIndex) {
            topCard = card;
            maxZIndex = card.zIndex;
        }
    });
    
    // Eğer bir kart bulunduysa drag başlat
    if (topCard) {
        topCard.startDrag(mouseX, mouseY);
        // Bu kartı en üste getir
        topCard.zIndex = nextZIndex++;
    }

    // Oyun bitti ve restart butonuna basılıyorsa
    if (gameOver && window.restartButton) {
        const { x, y, width, height } = window.restartButton;
        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
            init(); // Oyunu yeniden başlat
            gameOver = false; // gameOver durumunu sıfırla
            return;
        }
    }
}

function handleMouseMove(e){
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Sürüklenen malzemeyi güncelle
    if (draggedItem) {
        draggedItem.updatePosition(mouseX, mouseY);
    }
    
    // Dragging olan not kartlarını güncelle
    // Tum note cardlarını gezmeden olur gibi aslında, ŞIMDILIK BOYLE
    noteCards.forEach(card => {
        if (card.isDragging) {
            card.drag(mouseX, mouseY);
        }
    });
}

function handleMouseUp(e){
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Sürüklenen malzeme varsa bırakma işlemini kontrol et
    if (draggedItem) {
        let droppedOnOrder = false;
        
        // Siparişlerin üzerine bırakıldı mı kontrol et
        orders.forEach(order => {
            if (order.isUnderMouse(mouseX, mouseY)) {
                if (order.canAcceptIngredient(draggedItem.ingredient)) {
                    order.receiveIngredient(draggedItem.ingredient);
                    console.log(`✅ ${draggedItem.ingredient.name} siparişe eklendi!`);
                    droppedOnOrder = true;
                } else {
                    console.log(`❌ ${draggedItem.ingredient.name} bu sipariş için uygun değil!`);
                    order.shakeOrder();
                    lives--;
                    wrongSound.currentTime = 0;
                    wrongSound.play();
                }
            }
        });
        
        if (!droppedOnOrder) {
            console.log(`${draggedItem.ingredient.name} boş alana bırakıldı, kayboldu.`);
        }
        
        // Sürüklenen malzemeyi temizle
        draggedItem = null;
    }
    
    // Tüm not kartlarının drag durumunu durdur
    // Tum note cardlarını gezmeden olur gibi aslında, ŞIMDILIK BOYLE
    noteCards.forEach(card => {
        card.stopDrag();
    });
}

init();