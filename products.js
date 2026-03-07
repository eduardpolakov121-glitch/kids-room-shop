let products = JSON.parse(localStorage.getItem("products")) || [];

/* ЯКЩО МАГАЗИН ЗАПУСКАЄТЬСЯ ВПЕРШЕ — СТВОРЮЄМО ТЕСТОВІ ТОВАРИ */

if (products.length === 0) {
    products = [
        {
            id: "toy1",
            name: "Іграшка 1",
            category: "toy",
            price: 350,
            old: 450,
            description: "Яскрава дитяча іграшка для розвитку моторики та уяви.",
            img: "https://picsum.photos/300?random=1"
        },
        {
            id: "toy2",
            name: "Іграшка 2",
            category: "toy",
            price: 400,
            old: 520,
            description: "Безпечна іграшка для дітей від 3 років.",
            img: "https://picsum.photos/300?random=2"
        },
        {
            id: "stroller1",
            name: "Коляска 1",
            category: "stroller",
            price: 3500,
            old: 4200,
            description: "Зручна та легка дитяча коляска для щоденних прогулянок.",
            img: "https://picsum.photos/300?random=3"
        },
        {
            id: "seat1",
            name: "Автокрісло 1",
            category: "seat",
            price: 1800,
            old: 2200,
            description: "Надійне автокрісло для безпечних поїздок з дитиною.",
            img: "https://picsum.photos/300?random=4"
        }
    ];

    saveProducts();
}

/* ЗБЕРЕЖЕННЯ ТОВАРІВ */

function saveProducts() {
    localStorage.setItem("products", JSON.stringify(products));
}