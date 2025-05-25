# 🧠🍔 Kaotik Mutfak - Bir Mantık Restoranı Oyunu

> **"Köfte dediysem köfte değil, domates koy demek istedim!"**  
> Bir restoran işletiyorsun ama müşterilerin mantık sınırlarını zorluyor!

---
[Oyun linki→](https://hasnasahinoglu.github.io/js_game/)
## 🎯 OYUNUN HEDEFİ

**Kaotik Mutfak**, restoran yönetimi ile mantık bulmacalarını birleştiren HTML5 tabanlı bir canvas oyunudur.

Oyuncu, gelen siparişleri müşteri notlarına göre **doğru yorumlayarak** hamburger hazırlamalıdır. Ancak işin püf noktası şu:

> 🍽 Müşteriler mantıklı konuşmuyor. Siparişlerin arkasında karmaşık kurallar, ters mantıklar ve gizli anlamlar var.

---

## 🔥 ZORLUK (CHALLENGE)

Oyundaki asıl zorluk:

- Siparişteki malzeme isimleri rastgele eşleştirilmiş! (Köfte demek bazen domates demek olabilir!)
- Sayılar bile anlamını yitirmiş olabilir! (3 köfte demek, aslında 1 domates demek!)
- Mantıksal kurallar işler:  
  - “Köfte ya da Domates” → Yalnızca biri  
  - “Köfte hariç hepsi” → Köfte dışında her şey  
- Ve en kötüsü:  
  - 👩 **Pembe sipariş**lerde söylenenin *tam tersi* isteniyor!

Her siparişi doğru yorumlayarak hazırlamalı, müşterileri memnun etmelisin. Skor arttıkça gelen siparişler daha karmaşık hale gelir.

---

## 🕹️ KONTROLLER

Malzemeleri siparişlerin üzerine sürükle-bırak.

---

--

## 🖼️ OYUN GÖRSELLERİ

### 🧩 Siparişin geldiği an:
![OyunEkranı1](.assets\screenshots\2025-05-25 23_43_52-You don't know what you want_.png)

### 🍔 Malzeme seçimi ve burger hazırlama:
![OyunEkranı2](.assets\screenshots\2025-05-25 23_44_27-You don't know what you want_.png)

> Görseller `/assets/screenshots/` klasöründen alınabilir. Kendi ekran görüntülerinizi buraya yerleştirin.

---

## 🚀 OYUNU DENE

Oyunu yerel olarak çalıştırmak için:

```bash
git clone https://github.com/hasnasahinoglu/js_game_project.git
cd js_game_project
open index.html