const PRODUCT_PLACEHOLDER = "product-placeholder.svg";

const CATEGORIES = [
    { id: "toy", name: "Іграшки", icon: "🧸" },
    { id: "stroller", name: "Коляски", icon: "🛒" },
    { id: "seat", name: "Автокрісла", icon: "💺" },
    { id: "clothes", name: "Одяг", icon: "👕" },
    { id: "transport", name: "Транспорт", icon: "🚲" },
    { id: "sorter", name: "Сортери", icon: "🧩" },
    { id: "baby", name: "Для немовлят", icon: "🍼" },
    { id: "school", name: "Шкільні товари", icon: "🎒" },
    { id: "furniture", name: "Дитячі меблі", icon: "🛏️" },
    { id: "feeding", name: "Годування", icon: "🥣" },
    { id: "hygiene", name: "Гігієна", icon: "🧼" },
    { id: "bedding", name: "Постіль", icon: "🛌" },
    { id: "creativity", name: "Творчість", icon: "🎨" }
];

const SUPABASE_PRODUCTS_CONFIG = {
    url: "https://xhhzxiithajxgngmbzzd.supabase.co",
    anonKey: "sb_publishable_cRp6r2C_3nszludByS9V9Q_sl1QlHg5",
    table: "products"
};

const PRODUCTS_CACHE_KEY = "products";
const PRODUCTS_INIT_FLAG_KEY = "kids_room_products_seeded_v5_real_names";

let products = [];
let supabaseClientInstance = null;
let productsReady = false;
let productsInitPromise = null;

function buildDefaultProducts() {
    const make = (category, items) =>
        items.map((item, index) => ({
            id: `${category}-${index + 1}`,
            name: item.name,
            category,
            price: item.price,
            old: item.old,
            description: item.description,
            img: item.img || PRODUCT_PLACEHOLDER,
            is_hit: !!item.is_hit,
            is_sale: !!item.is_sale,
            is_new: !!item.is_new
        }));

    return [
        ...make("toy", [
            {
                name: "Ведмедик Sweet Bear Soft 35 см",
                price: 899,
                old: 979,
                description: "М’який плюшевий ведмедик для обіймів, сну та затишних ігор у дитячій кімнаті.",
                is_hit: true,
                is_sale: true
            },
            {
                name: "Плюшевий зайчик Cloud Bunny 42 см",
                price: 729,
                old: 789,
                description: "Приємна на дотик м’яка іграшка, яку зручно брати з собою в ліжечко або в дорогу."
            },
            {
                name: "Розумне цуценя Happy Puppy зі звуками",
                price: 1699,
                old: 1799,
                description: "Інтерактивна іграшка з веселими фразами, мелодіями та елементами раннього розвитку.",
                is_new: true
            },
            {
                name: "Набір кубиків Mega Blocks First Set 60 деталей",
                price: 1149,
                old: 1239,
                description: "Великі безпечні кубики для перших конструкцій, розвитку моторики та уяви.",
                is_hit: true
            },
            {
                name: "Лялька Little Dream Fashion з аксесуарами",
                price: 1189,
                old: 1289,
                description: "Яскрава лялька для рольових ігор, перевдягань і домашніх дитячих сюжетів."
            },
            {
                name: "Трек Speed Wheels стартовий набір",
                price: 969,
                old: 1049,
                description: "Компактний трек з машинкою для активної гри, перегонів і веселого дозвілля."
            },
            {
                name: "Нічник-проектор Baby Star Bear",
                price: 1399,
                old: 1499,
                description: "М’який нічник із ніжним світлом та спокійними мелодіями для вечірнього засинання.",
                is_sale: true
            },
            {
                name: "Подушка-іграшка Kitty Cloud",
                price: 579,
                old: 639,
                description: "Легка м’яка іграшка-подушка для відпочинку, декору дитячої кімнати та обіймів."
            },
            {
                name: "Дитяча каса Smart Market із кошиком",
                price: 839,
                old: 899,
                description: "Ігровий набір для сюжетів у магазин із кнопками, аксесуарами та товарами."
            },
            {
                name: "Музичний телефон Baby Melody Touch",
                price: 489,
                old: 539,
                description: "Компактна музична іграшка з кнопками, звуками та світловими елементами.",
                is_new: true
            }
        ]),

        ...make("stroller", [
            {
                name: "Коляска прогулянкова City Walk Lite Black",
                price: 6890,
                old: 7040,
                description: "Легка прогулянкова коляска для щоденних маршрутів містом, парком і торговими центрами.",
                is_hit: true
            },
            {
                name: "Коляска 2 в 1 Cozy Move Graphite",
                price: 9580,
                old: 9720,
                description: "Універсальна модель для малюка з люлькою та прогулянковим блоком на кожен сезон."
            },
            {
                name: "Коляска прогулянкова Travel Fold Sand",
                price: 8240,
                old: 8390,
                description: "Маневрена модель зі швидким складанням, містким капюшоном і зручним сидінням.",
                is_sale: true
            },
            {
                name: "Коляска Air Ride Compact Grey",
                price: 7180,
                old: 7320,
                description: "Компактна коляска для поїздок, шопінгу та щоденних прогулянок із дитиною."
            },
            {
                name: "Коляска Urban Baby Air Mint",
                price: 9490,
                old: 9640,
                description: "Сучасна прогулянкова модель з плавним ходом, стильним дизайном і гарною амортизацією.",
                is_new: true
            },
            {
                name: "Коляска 2 в 1 Family Travel Beige",
                price: 11790,
                old: 11940,
                description: "Практичний варіант для батьків, які шукають комфортну коляску від народження."
            },
            {
                name: "Коляска Street Comfort Olive",
                price: 6360,
                old: 6490,
                description: "Всесезонна прогулянкова модель із теплим чохлом та надійними колесами."
            },
            {
                name: "Коляска Easy Drive Navy",
                price: 5590,
                old: 5720,
                description: "Доступна та зручна коляска для щоденного використання, поїздок і прогулянок."
            },
            {
                name: "Коляска Premium Soft 2 в 1 Ivory",
                price: 14090,
                old: 14290,
                description: "Комфортна преміальна коляска з просторою люлькою та м’яким ходом.",
                is_hit: true
            },
            {
                name: "Коляска Travel Mini Stone",
                price: 7390,
                old: 7540,
                description: "Зручна міська коляска для активних батьків і компактного зберігання."
            }
        ]),

        ...make("seat", [
            {
                name: "Автокрісло Safe Ride 360 ISOFIX Graphite",
                price: 4890,
                old: 5040,
                description: "Поворотне автокрісло з ISOFIX для безпечних поїздок і комфортної посадки дитини.",
                is_hit: true
            },
            {
                name: "Автолюлька Baby Nest i-Size Black",
                price: 6890,
                old: 7040,
                description: "Легка автолюлька для новонароджених із м’яким вкладишем і захистом голови."
            },
            {
                name: "Автокрісло Air Protect 0-36 кг Sand",
                price: 6190,
                old: 6340,
                description: "Універсальне крісло на тривалий період використання з боковим захистом.",
                is_sale: true
            },
            {
                name: "Автокрісло Comfort Fix Junior Grey",
                price: 4290,
                old: 4430,
                description: "Зручна модель для старшої дитини з ергономічною спинкою та надійною фіксацією.",
                is_new: true
            },
            {
                name: "Автокрісло Drive Guard Plus Black",
                price: 9590,
                old: 9740,
                description: "Міцне крісло з глибокою посадкою, м’якими вставками та комфортом у дорозі."
            },
            {
                name: "Автокрісло Rotate Me 360 Deep Blue",
                price: 14990,
                old: 15190,
                description: "Поворотна модель із сучасною системою безпеки та зручним доступом до дитини."
            },
            {
                name: "Автокрісло Road Buddy 9-36 кг",
                price: 3720,
                old: 3860,
                description: "Практичний варіант для щоденних міських поїздок і сімейних подорожей."
            },
            {
                name: "Автокрісло Premium Shield i-Size Carbon",
                price: 18290,
                old: 18490,
                description: "Преміальна модель для батьків, яким важливі безпека, стабільність і комфорт."
            },
            {
                name: "Автокрісло Travel Seat Family 0-25 кг",
                price: 5380,
                old: 5530,
                description: "Надійне крісло для тривалих поїздок з дитиною різного віку."
            },
            {
                name: "Бустер Road Up Compact",
                price: 1960,
                old: 2080,
                description: "Компактний бустер для старших дітей, який зручно брати в автомобіль.",
                is_hit: true
            }
        ]),

        ...make("clothes", [
            {
                name: "Набір боді Baby Cotton 5 шт",
                price: 949,
                old: 999,
                description: "М’який комплект боді для немовляти на кожен день, сон і домашній комфорт.",
                is_hit: true
            },
            {
                name: "Піжама Sleep Time Kids 2 шт",
                price: 679,
                old: 729,
                description: "Практичний комплект піжам із приємної тканини для затишного сну."
            },
            {
                name: "Світшот Mini Mood із принтом Dino",
                price: 799,
                old: 849,
                description: "Легкий дитячий світшот для садочка, прогулянок і повсякденного гардероба.",
                is_new: true
            },
            {
                name: "Штанці Active Baby Soft Grey",
                price: 469,
                old: 509,
                description: "Комфортні штани для активних ігор удома, у дворі або в садочку."
            },
            {
                name: "Футболки Basic Color 3 шт",
                price: 539,
                old: 589,
                description: "Базовий набір футболок для щоденного носіння й легкого поєднання.",
                is_sale: true
            },
            {
                name: "Куртка демісезонна Little Wind Olive",
                price: 1679,
                old: 1789,
                description: "Зручна демісезонна куртка для прогулянок у прохолодну та вітряну погоду."
            },
            {
                name: "Ромпер Cozy Baby Milk",
                price: 449,
                old: 489,
                description: "М’який ромпер для малюка з комфортною посадкою і зручними застібками."
            },
            {
                name: "Шапка-шолом Warm Hug Winter",
                price: 899,
                old: 949,
                description: "Теплий варіант для захисту від вітру та прохолоди в осінньо-зимовий сезон.",
                is_hit: true
            },
            {
                name: "Джинси Junior Street Fit",
                price: 859,
                old: 909,
                description: "Зручні джинси для школи, прогулянок і щоденного активного дня."
            },
            {
                name: "Сукня Little Bloom Sky",
                price: 719,
                old: 769,
                description: "Легка святкова сукня для дитячих подій, фотосесій і сімейних свят."
            }
        ]),

        ...make("transport", [
            {
                name: "Самокат Flash Ride зі світними колесами",
                price: 1469,
                old: 1520,
                description: "Маневрений самокат для двору, парку та активних прогулянок.",
                is_hit: true
            },
            {
                name: "Біговел Tiny Rider 12 Air",
                price: 2140,
                old: 2220,
                description: "Легкий біговел для розвитку координації, балансу та впевненості в русі."
            },
            {
                name: "Велосипед триколісний Smart Trike Family",
                price: 3640,
                old: 3740,
                description: "Зручний транспорт із батьківською ручкою для перших поїздок малюка.",
                is_sale: true
            },
            {
                name: "Самокат City Glide Deluxe",
                price: 4920,
                old: 5090,
                description: "Плавний і стійкий самокат для щоденного міського використання."
            },
            {
                name: "Електромобіль Mini Driver Red",
                price: 8120,
                old: 8290,
                description: "Дитячий електромобіль для катання у дворі, на подвір’ї та дачі.",
                is_new: true
            },
            {
                name: "Толокар First Drive Blue",
                price: 969,
                old: 1020,
                description: "Надійна машинка-каталка для перших самостійних рухів дитини."
            },
            {
                name: "Самокат Urban Sprint 2 Wheel",
                price: 1929,
                old: 1990,
                description: "Міцна двоколісна модель для старших дітей та активних прогулянок."
            },
            {
                name: "Велосипед Kid Bike Start 16",
                price: 4840,
                old: 4990,
                description: "Дитячий велосипед із додатковими колесами для перших навичок їзди."
            },
            {
                name: "Квадроцикл дитячий Power ATV Green",
                price: 9190,
                old: 9370,
                description: "Яскравий акумуляторний квадроцикл для впевненого катання та веселих ігор."
            },
            {
                name: "Біговел Balance Move Pro",
                price: 2820,
                old: 2910,
                description: "Сучасний біговел для щоденних прогулянок і розвитку координації.",
                is_hit: true
            }
        ]),

        ...make("sorter", [
            {
                name: "Сортер Color Match Animals",
                price: 349,
                old: 389,
                description: "Розвивальна гра для вивчення кольорів, форм і тренування дрібної моторики.",
                is_hit: true,
                is_sale: true
            },
            {
                name: "Дерев’яний сортер Logic Box 5 в 1",
                price: 619,
                old: 669,
                description: "Універсальний набір для знайомства з формами, кольорами й першим рахунком."
            },
            {
                name: "Сортер Bus Shapes Junior",
                price: 209,
                old: 229,
                description: "Яскравий сортер у формі автобуса для раннього розвитку та веселих занять.",
                is_new: true
            },
            {
                name: "Сортер Train Fun Blocks",
                price: 229,
                old: 249,
                description: "Потяг-сортер із фігурками для простих логічних ігор у домашніх умовах."
            },
            {
                name: "Сортер Wooden Geo Stars",
                price: 569,
                old: 619,
                description: "Дерев’яний сортер для спокійної гри, розвитку уваги та координації."
            },
            {
                name: "Сортер Baby Blocks Bucket",
                price: 659,
                old: 709,
                description: "Відерце з об’ємними фігурками для перших вправ на логіку й посидючість.",
                is_hit: true
            },
            {
                name: "Сортер Shape Bucket Play Set",
                price: 729,
                old: 779,
                description: "Набір із яскравими елементами для самостійних занять малюка."
            },
            {
                name: "Сортер Cube Smart Mini",
                price: 279,
                old: 309,
                description: "Компактний кубик для розвитку моторики та знайомства з базовими формами."
            },
            {
                name: "Магнітна риболовля Sea Learn Set",
                price: 419,
                old: 469,
                description: "Цікавий набір для уважності, координації рухів і домашніх розвивальних ігор."
            },
            {
                name: "Сортер Geometry Wood Start",
                price: 499,
                old: 549,
                description: "Практичний дерев’яний набір для перших кроків у вивченні форм і кольорів."
            }
        ]),

        ...make("baby", [
            {
                name: "Пляшечка Natural Flow Baby 260 мл",
                price: 479,
                old: 519,
                description: "Зручна пляшечка для щоденного годування з комфортною формою та м’якою соскою.",
                is_hit: true
            },
            {
                name: "Пустушка Soft Calm 0-6 міс",
                price: 309,
                old: 339,
                description: "Легка пустушка для щоденного використання та спокійного засинання."
            },
            {
                name: "Прорізувач Cool Teether Aqua",
                price: 179,
                old: 199,
                description: "Зручний прорізувач для зменшення дискомфорту під час появи зубчиків."
            },
            {
                name: "Підвіска на коляску Happy Fox Spiral",
                price: 1099,
                old: 1149,
                description: "Розвивальна підвіска з м’якими елементами, шурхотінням і яскравими деталями.",
                is_new: true
            },
            {
                name: "Розвивальна дуга Play Arch Day&Night",
                price: 1999,
                old: 2099,
                description: "Дуга з іграшками та активностями для коляски, автокрісла або ліжечка."
            },
            {
                name: "Набір щітка та гребінець Baby Care Soft",
                price: 269,
                old: 299,
                description: "Практичний набір для делікатного догляду за волоссям малюка."
            },
            {
                name: "Антиколікова пляшечка Easy Start 120 мл",
                price: 229,
                old: 259,
                description: "Компактна пляшечка для новонароджених із комфортним потоком та м’якою соскою."
            },
            {
                name: "Термометр електронний Baby Check",
                price: 419,
                old: 459,
                description: "Електронний термометр для швидкого та зручного домашнього контролю температури."
            },
            {
                name: "Музична підвіска Sleepy Stars Mobile",
                price: 559,
                old: 609,
                description: "Підвісна іграшка для розвитку уваги, слуху та заспокоєння малюка.",
                is_sale: true
            },
            {
                name: "Слинявчик Silicone Pocket Mint",
                price: 209,
                old: 229,
                description: "Силіконовий слинявчик із кишенькою для зручного годування вдома та в дорозі."
            }
        ]),

        ...make("school", [
            {
                name: "Рюкзак School Move Pixel Space",
                price: 2129,
                old: 2179,
                description: "Місткий шкільний рюкзак із зручною спинкою та практичними відділеннями.",
                is_hit: true
            },
            {
                name: "Пенал One Zip Smart Blue",
                price: 459,
                old: 499,
                description: "Зручний пенал для ручок, олівців і дрібних речей на кожен навчальний день."
            },
            {
                name: "Ланчбокс Daily Snack із секціями",
                price: 339,
                old: 369,
                description: "Компактний контейнер для перекусів у школі, гуртках або поїздках."
            },
            {
                name: "Пляшка для води School Fresh 550 мл",
                price: 409,
                old: 449,
                description: "Легка шкільна пляшка для води на кожен день.",
                is_new: true
            },
            {
                name: "Набір кольорових ручок Color Line 10",
                price: 249,
                old: 279,
                description: "Практичний набір для навчання, конспектів і творчих завдань."
            },
            {
                name: "Комплект зошитів Study Box 10 шт",
                price: 229,
                old: 259,
                description: "Набір зошитів у клітинку для навчального року та щоденних занять."
            },
            {
                name: "Альбом для малювання Art Start 30 арк",
                price: 129,
                old: 149,
                description: "Альбом для уроків малювання, творчих завдань і домашніх робіт."
            },
            {
                name: "Олівці Color Art 24 відтінки",
                price: 299,
                old: 329,
                description: "Яскравий набір кольорових олівців для школи, творчості та дозвілля.",
                is_sale: true
            },
            {
                name: "Папка для праці Craft Folder Zip",
                price: 269,
                old: 299,
                description: "Зручна папка для альбомів, кольорового паперу та уроків праці."
            },
            {
                name: "Сумка для змінного взуття Easy Bag Reflect",
                price: 319,
                old: 349,
                description: "Легка сумка для взуття чи спортивної форми з практичним шнурком."
            }
        ]),

        ...make("furniture", [
            {
                name: "Стіл дитячий Play Table White",
                price: 2379,
                old: 2439,
                description: "Зручний дитячий столик для ігор, читання, ліплення та малювання.",
                is_hit: true
            },
            {
                name: "Стілець дитячий Kids Chair Milk",
                price: 1179,
                old: 1239,
                description: "Міцний і легкий стілець для творчих занять, ігор та щоденного використання."
            },
            {
                name: "Стелаж для іграшок Box Shelf Mini",
                price: 4640,
                old: 4790,
                description: "Практичний стелаж для зберігання книг, коробок, іграшок і дитячих дрібниць."
            },
            {
                name: "Парта для навчання Study Desk Smart",
                price: 6840,
                old: 6990,
                description: "Регульований стіл для уроків, читання та творчих занять удома.",
                is_new: true
            },
            {
                name: "Крісло дитяче Ergo Junior Match",
                price: 4920,
                old: 5070,
                description: "Ергономічне крісло для комфортної посадки під час навчання і занять."
            },
            {
                name: "Комод для дитячих речей Soft Home 4",
                price: 8290,
                old: 8440,
                description: "Місткий комод для одягу, текстилю, підгузків та дитячих аксесуарів."
            },
            {
                name: "Ліжечко дитяче Sleep Wood Classic",
                price: 6430,
                old: 6590,
                description: "Дерев’яне ліжечко для малюка з міцною конструкцією та затишним дизайном.",
                is_sale: true
            },
            {
                name: "Полиця для книжок Book Front Kids",
                price: 3160,
                old: 3270,
                description: "Низька полиця для дитячих книжок, яка допомагає підтримувати порядок."
            },
            {
                name: "Шафа дитяча Junior Room White",
                price: 7140,
                old: 7310,
                description: "Зручна шафа для одягу, коробок, іграшок і сезонних речей."
            },
            {
                name: "Скриня для іграшок Toy Box Wood",
                price: 2860,
                old: 2970,
                description: "Містка скриня для акуратного зберігання іграшок у дитячій кімнаті."
            }
        ]),

        ...make("feeding", [
            {
                name: "Пляшечка Baby Natural Care 330 мл",
                price: 539,
                old: 579,
                description: "Пляшечка для комфортного щоденного годування з ергономічною формою.",
                is_hit: true
            },
            {
                name: "Ложечки м’які First Spoon 2 шт",
                price: 209,
                old: 229,
                description: "М’які ложечки для першого прикорму та щоденного харчування малюка."
            },
            {
                name: "Стілець для годування Comfort Meal Grey",
                price: 4840,
                old: 4990,
                description: "Зручний стілець для годування з м’яким сидінням і практичними регулюваннями."
            },
            {
                name: "Нагрудник Silicone Catch Pocket",
                price: 199,
                old: 219,
                description: "Силіконовий нагрудник із кишенькою для акуратного прийому їжі."
            },
            {
                name: "Тарілка на присосці Stay Bowl Mint",
                price: 439,
                old: 469,
                description: "Тарілка, яка краще тримається на столі та зручна для першого прикорму.",
                is_new: true
            },
            {
                name: "Поїльник Soft Spout 200 мл",
                price: 379,
                old: 409,
                description: "Практичний поїльник для переходу від пляшечки до самостійного пиття."
            },
            {
                name: "Термосумка Bottle Keep Warm",
                price: 329,
                old: 359,
                description: "Сумка для збереження температури дитячої пляшечки під час прогулянок."
            },
            {
                name: "Контейнери для прикорму Food Box 4 шт",
                price: 309,
                old: 339,
                description: "Набір контейнерів для пюре, каш і зберігання дитячого харчування."
            },
            {
                name: "Стерилізатор Home Steam Compact",
                price: 1680,
                old: 1760,
                description: "Зручний стерилізатор для догляду за пляшечками та аксесуарами.",
                is_sale: true
            },
            {
                name: "Підігрівач для пляшечок Warm Baby Home",
                price: 1750,
                old: 1830,
                description: "Компактний підігрівач для молока, суміші та дитячого харчування."
            }
        ]),

        ...make("hygiene", [
            {
                name: "Підгузки Soft Care Premium Size 3",
                price: 879,
                old: 929,
                description: "Комфортні дитячі підгузки для щоденного використання вдома та на прогулянці.",
                is_hit: true
            },
            {
                name: "Підгузки-трусики Active Pants Size 4",
                price: 909,
                old: 959,
                description: "Зручні трусики для активних малюків і швидкого переодягання."
            },
            {
                name: "Вологі серветки Aqua Soft 60 шт",
                price: 199,
                old: 219,
                description: "М’які вологі серветки для делікатного очищення шкіри малюка."
            },
            {
                name: "Шампунь дитячий Gentle Baby 500 мл",
                price: 229,
                old: 249,
                description: "Делікатний дитячий шампунь для щоденного догляду за волоссям."
            },
            {
                name: "Гель для купання Baby Moments Soft",
                price: 249,
                old: 269,
                description: "М’який засіб для купання малюка з приємною текстурою.",
                is_new: true
            },
            {
                name: "Крем під підгузок Calm Skin 125 г",
                price: 329,
                old: 359,
                description: "Захисний крем для догляду за чутливою дитячою шкірою."
            },
            {
                name: "Ножиці дитячі Safety Nails",
                price: 149,
                old: 169,
                description: "Безпечні ножиці для догляду за нігтями новонародженого і малюка."
            },
            {
                name: "Ванночка дитяча Bath Time 102 см",
                price: 529,
                old: 569,
                description: "Простора ванночка для щоденного купання вдома.",
                is_sale: true
            },
            {
                name: "Горщик дитячий Comfort Potty Mint",
                price: 379,
                old: 409,
                description: "Зручний дитячий горщик зі спинкою для періоду привчання."
            },
            {
                name: "Термометр для води Water Check Baby",
                price: 169,
                old: 189,
                description: "Практичний аксесуар для контролю температури під час купання."
            }
        ]),

        ...make("bedding", [
            {
                name: "Комплект постелі Cotton Dream Kids",
                price: 859,
                old: 909,
                description: "М’який комплект дитячої постелі для затишного та комфортного сну.",
                is_hit: true
            },
            {
                name: "Подушка дитяча Soft Sleep 40x60",
                price: 299,
                old: 329,
                description: "Зручна подушка для дитячого ліжка або денного відпочинку."
            },
            {
                name: "Ковдра дитяча Warm Cloud 105x140",
                price: 669,
                old: 719,
                description: "Легка ковдра для щоденного сну та затишку у будь-яку пору року."
            },
            {
                name: "Плед дитячий Cozy Blanket Mint",
                price: 499,
                old: 539,
                description: "М’який плед для прогулянок, ліжечка або денного відпочинку.",
                is_new: true
            },
            {
                name: "Простирадло на резинці Soft Fit 60x120",
                price: 269,
                old: 289,
                description: "Практичне простирадло, яке добре тримається на дитячому матраці."
            },
            {
                name: "Захист у ліжечко Dream Bumper Set",
                price: 1519,
                old: 1599,
                description: "М’які бортики для безпечного та затишного простору малюка."
            },
            {
                name: "Наволочка дитяча Cotton Touch 40x60",
                price: 189,
                old: 209,
                description: "Бавовняна наволочка для щоденного використання та легкого догляду."
            },
            {
                name: "Покривало в дитячу кімнату Room Decor Kids",
                price: 809,
                old: 859,
                description: "Стильне покривало для охайного оформлення дитячого ліжка.",
                is_sale: true
            },
            {
                name: "Спальний мішок Baby Sleep Bag Warm",
                price: 1860,
                old: 1940,
                description: "Зручний спальний мішок для спокійного сну без зайвого розкривання."
            },
            {
                name: "Наматрацник водонепроникний Soft Protect 60x120",
                price: 359,
                old: 389,
                description: "Захист матраца від вологи для дитячого ліжечка та щоденного користування."
            }
        ]),

        ...make("creativity", [
            {
                name: "Набір алмазної мозаїки Crystal Art 40x50",
                price: 519,
                old: 569,
                description: "Творчий набір для викладання картини стразами вдома.",
                is_hit: true
            },
            {
                name: "Картина стразами Diamond Hobby Morning",
                price: 519,
                old: 569,
                description: "Яскравий набір для спокійного творчого дозвілля та уважної роботи."
            },
            {
                name: "Фломастери Color Super Tips 24 кольори",
                price: 629,
                old: 679,
                description: "Насичені кольори для малювання, розфарбовування і творчих проєктів.",
                is_new: true
            },
            {
                name: "Пластилін Soft Dough 8 баночок",
                price: 419,
                old: 459,
                description: "М’яка маса для ліплення, розвитку моторики та домашньої творчості."
            },
            {
                name: "Набір для гравюри Art Scratch Junior",
                price: 169,
                old: 189,
                description: "Компактний творчий набір для подарунка й цікавих домашніх занять."
            },
            {
                name: "Фарби акварельні Water Color 24",
                price: 209,
                old: 229,
                description: "Практичний набір акварельних фарб для школи та творчих занять."
            },
            {
                name: "Набір для творчості Create Box 6+",
                price: 699,
                old: 749,
                description: "Готовий набір для малювання, аплікацій і розвитку фантазії."
            },
            {
                name: "Мольберт дитячий Double Art Board",
                price: 1850,
                old: 1940,
                description: "Двосторонній мольберт для крейди, маркерів і перших уроків малювання.",
                is_sale: true
            },
            {
                name: "Кінетичний пісок Sand Play Set",
                price: 329,
                old: 359,
                description: "Набір кінетичного піску з формочками для творчої гри вдома."
            },
            {
                name: "Набір наліпок і аплікацій Fun Sticker Box",
                price: 469,
                old: 509,
                description: "Творчий набір для розвитку дрібної моторики, посидючості та уяви."
            }
        ])
    ];
}

const DEFAULT_PRODUCTS = buildDefaultProducts();

function toBool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function sanitizeProductImage(url) {
    const value = String(url || "").trim();

    if (!value) return PRODUCT_PLACEHOLDER;
    if (value === PRODUCT_PLACEHOLDER) return PRODUCT_PLACEHOLDER;

    const lower = value.toLowerCase();

    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("./") ||
        lower.startsWith("../") ||
        lower.startsWith("/") ||
        lower.startsWith("data:image/") ||
        lower === "product-placeholder.svg"
    ) {
        return value;
    }

    return PRODUCT_PLACEHOLDER;
}

function normalizeProduct(raw, fallbackId = null) {
    const price = Number(raw?.price || 0);
    const oldPrice = Number(raw?.old || raw?.price || 0);
    const knownCategory = CATEGORIES.some(category => category.id === String(raw?.category || "").trim());

    return {
        id: String(raw?.id || fallbackId || `prod_${Date.now()}`),
        name: String(raw?.name || "Без назви").trim(),
        category: knownCategory ? String(raw?.category).trim() : "toy",
        price: Number.isFinite(price) ? Math.round(price) : 0,
        old: Number.isFinite(oldPrice) ? Math.round(oldPrice) : 0,
        description: String(raw?.description || "").trim(),
        img: sanitizeProductImage(raw?.img),
        is_hit: toBool(raw?.is_hit),
        is_sale: toBool(raw?.is_sale),
        is_new: toBool(raw?.is_new)
    };
}

function getCategoryName(categoryId) {
    const category = CATEGORIES.find(item => item.id === categoryId);
    return category ? category.name : (categoryId || "Без категорії");
}

function getCategoryIcon(categoryId) {
    const category = CATEGORIES.find(item => item.id === categoryId);
    return category ? category.icon : "📦";
}

function getSafeProductImage(product) {
    return sanitizeProductImage(product?.img);
}

function getProductsFromStorage() {
    try {
        const stored = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || "[]");
        if (!Array.isArray(stored)) return [];
        return stored.map((item, index) => normalizeProduct(item, `prod_${index + 1}`));
    } catch (error) {
        console.error("Не вдалося прочитати товари з localStorage", error);
        return [];
    }
}

function setProductsState(list, emitEvent = true) {
    products = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    window.products = products;
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));

    if (emitEvent) {
        window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));
    }

    return products;
}

async function ensureSupabaseLoaded() {
    if (supabaseClientInstance) return supabaseClientInstance;

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-kids-room-supabase="true"]');
            if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
            script.async = true;
            script.defer = true;
            script.dataset.kidsRoomSupabase = "true";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    supabaseClientInstance = window.supabase.createClient(
        SUPABASE_PRODUCTS_CONFIG.url,
        SUPABASE_PRODUCTS_CONFIG.anonKey
    );

    return supabaseClientInstance;
}

async function fetchProductsFromSupabase() {
    const client = await ensureSupabaseLoaded();

    const { data, error } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id, name, category, price, old, description, img, is_hit, is_sale, is_new")
        .order("id", { ascending: true });

    if (error) throw error;

    return Array.isArray(data)
        ? data.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];
}

async function replaceAllProductsInSupabase(list) {
    const client = await ensureSupabaseLoaded();
    const normalized = Array.isArray(list)
        ? list.map((item, index) => normalizeProduct(item, item?.id || `prod_${index + 1}`))
        : [];

    const { data: existingRows, error: existingError } = await client
        .from(SUPABASE_PRODUCTS_CONFIG.table)
        .select("id");

    if (existingError) throw existingError;

    const existingIds = Array.isArray(existingRows) ? existingRows.map(item => String(item.id)) : [];
    const nextIds = normalized.map(item => String(item.id));
    const idsToDelete = existingIds.filter(id => !nextIds.includes(id));

    if (idsToDelete.length) {
        const { error: deleteError } = await client
            .from(SUPABASE_PRODUCTS_CONFIG.table)
            .delete()
            .in("id", idsToDelete);

        if (deleteError) throw deleteError;
    }

    if (normalized.length) {
        const { error: upsertError } = await client
            .from(SUPABASE_PRODUCTS_CONFIG.table)
            .upsert(normalized, { onConflict: "id" });

        if (upsertError) throw upsertError;
    }

    return normalized;
}

async function saveProducts() {
    const snapshot = Array.isArray(products) ? [...products] : [];
    setProductsState(snapshot, true);
    await replaceAllProductsInSupabase(snapshot);
    return products;
}

async function saveSingleProductToSupabase(product) {
    const normalized = normalizeProduct(product, product?.id);
    const index = products.findIndex(item => String(item.id) === String(normalized.id));

    if (index >= 0) {
        products[index] = normalized;
    } else {
        products.push(normalized);
    }

    setProductsState(products, true);
    await replaceAllProductsInSupabase(products);
    return products;
}

async function deleteProductFromSupabase(id) {
    products = products.filter(item => String(item.id) !== String(id));
    setProductsState(products, true);
    await replaceAllProductsInSupabase(products);
    return products;
}

function looksLikeOldTemplateCatalog(list) {
    if (!Array.isArray(list) || !list.length) return true;

    const templateMarkers = [
        "Іграшка 2",
        "Коляска 1",
        "Автокрісло 1",
        "Дитячий костюм 1",
        "Дитячий транспорт 1",
        "Сортер 1",
        "Товар для немовлят 1",
        "Шкільний товар 1",
        "Дитячі меблі 1",
        "Товар для годування 1",
        "Товар для гігієни 1",
        "Постіль 1",
        "Товар для творчості 1"
    ];

    const names = list.map(item => String(item?.name || "").trim());
    return templateMarkers.some(marker => names.includes(marker));
}

async function seedDefaultProductsIfNeeded() {
    const seeded = localStorage.getItem(PRODUCTS_INIT_FLAG_KEY) === "true";

    let remoteProducts = [];
    try {
        remoteProducts = await fetchProductsFromSupabase();
    } catch (error) {
        console.error("Помилка читання товарів із Supabase:", error);
    }

    const mustReplaceCatalog = !seeded || looksLikeOldTemplateCatalog(remoteProducts);

    if (mustReplaceCatalog) {
        await replaceAllProductsInSupabase(DEFAULT_PRODUCTS);
        localStorage.setItem(PRODUCTS_INIT_FLAG_KEY, "true");
        const refreshed = await fetchProductsFromSupabase();
        setProductsState(refreshed.length ? refreshed : DEFAULT_PRODUCTS, false);
        return products;
    }

    if (remoteProducts.length > 0) {
        setProductsState(remoteProducts, false);
        return remoteProducts;
    }

    await replaceAllProductsInSupabase(DEFAULT_PRODUCTS);
    localStorage.setItem(PRODUCTS_INIT_FLAG_KEY, "true");

    const afterSeed = await fetchProductsFromSupabase();
    setProductsState(afterSeed.length ? afterSeed : DEFAULT_PRODUCTS, false);
    return products;
}

async function initializeProducts() {
    if (productsInitPromise) return productsInitPromise;

    productsInitPromise = (async () => {
        const cached = getProductsFromStorage();
        if (cached.length) {
            setProductsState(cached, false);
        } else {
            setProductsState(DEFAULT_PRODUCTS, false);
        }

        try {
            await seedDefaultProductsIfNeeded();
        } catch (error) {
            console.error("Помилка ініціалізації товарів:", error);
        }

        productsReady = true;
        window.products = products;
        window.dispatchEvent(new CustomEvent("products:ready", { detail: products }));
        window.dispatchEvent(new CustomEvent("products:updated", { detail: products }));
        return products;
    })();

    return productsInitPromise;
}

function refreshProductsFromStorage() {
    return products;
}

async function refreshProductsFromSupabase() {
    try {
        const remoteProducts = await fetchProductsFromSupabase();
        if (remoteProducts.length) {
            setProductsState(remoteProducts, true);
        }
        return products;
    } catch (error) {
        console.error("Не вдалося оновити товари з Supabase", error);
        return products;
    }
}

function findProductById(id) {
    return products.find(item => String(item.id) === String(id)) || null;
}

window.PRODUCT_PLACEHOLDER = PRODUCT_PLACEHOLDER;
window.CATEGORIES = CATEGORIES;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;
window.products = products;
window.productsReady = () => productsReady;
window.initializeProducts = initializeProducts;
window.refreshProductsFromStorage = refreshProductsFromStorage;
window.refreshProductsFromSupabase = refreshProductsFromSupabase;
window.normalizeProduct = normalizeProduct;
window.getCategoryName = getCategoryName;
window.getCategoryIcon = getCategoryIcon;
window.getSafeProductImage = getSafeProductImage;
window.saveProducts = saveProducts;
window.saveSingleProductToSupabase = saveSingleProductToSupabase;
window.deleteProductFromSupabase = deleteProductFromSupabase;
window.findProductById = findProductById;
window.sanitizeProductImage = sanitizeProductImage;

window.addEventListener("storage", event => {
    if (event.key === PRODUCTS_CACHE_KEY) {
        const cached = getProductsFromStorage();
        setProductsState(cached, true);
    }
});

initializeProducts().catch(error => {
    console.error(error);
});