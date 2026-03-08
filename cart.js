let cart = JSON.parse(localStorage.getItem("cart")) || [];

const NOVA_POSHTA_API_KEY = "0cddc3bd30e2e4de2f2ce8f46313a168";
const NOVA_POSHTA_API_URL = "https://api.novaposhta.ua/v2.0/json/";

let selectedCity = null;

/* КОРЗИНА */

function toggleCart() {
document.getElementById("cart").classList.toggle("open");
document.getElementById("cart-overlay").classList.toggle("active");
}

function closeCart() {
document.getElementById("cart").classList.remove("open");
document.getElementById("cart-overlay").classList.remove("active");
}

/* ДОБАВИТЬ В КОРЗИНУ */

function addToCart(id) {

let qtyInput = document.getElementById("qty-"+id);
let qty = parseInt(qtyInput ? qtyInput.value : 1);

let product = products.find(p=>p.id===id);
if(!product)return;

let item = cart.find(p=>p.id===id);

if(item){
item.qty += qty;
}else{
cart.push({...product,qty});
}

renderCart();
saveCart();
showToast("Товар додано в кошик");
}

/* ПЛЮС */

function cartPlus(id){

let item = cart.find(p=>p.id===id);
if(!item)return;

item.qty++;
renderCart();
saveCart();

}

/* МИНУС */

function cartMinus(id){

let item = cart.find(p=>p.id===id);
if(!item)return;

if(item.qty>1){
item.qty--;
}else{
cart = cart.filter(p=>p.id!==id);
}

renderCart();
saveCart();

}

/* РЕНДЕР КОРЗИНЫ */

function renderCart(){

let items = document.getElementById("cart-items");
let count = document.getElementById("cart-count");
let total = document.getElementById("total");

if(!items)return;

items.innerHTML="";

let sum = 0;
let qty = 0;

cart.forEach(p=>{

sum += p.price*p.qty;
qty += p.qty;

items.innerHTML += `
<div class="cart-item">

<div>
${p.name}<br>
${p.price} грн
</div>

<div>
<button onclick="cartMinus('${p.id}')">−</button>
${p.qty}
<button onclick="cartPlus('${p.id}')">+</button>
</div>

</div>
`;

});

count.innerText = qty;
total.innerText = "Разом: "+sum+" грн";

}

/* ОФОРМЛЕНИЕ */

function checkout(){

if(cart.length===0){
alert("Кошик порожній");
return;
}

document.getElementById("checkout-modal").classList.add("open");

}

/* ЗАКРЫТЬ */

function closeCheckoutModal(){
document.getElementById("checkout-modal").classList.remove("open");
}

/* НОВА ПОШТА API */

async function callNP(model,method,props){

let res = await fetch(NOVA_POSHTA_API_URL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
apiKey:NOVA_POSHTA_API_KEY,
modelName:model,
calledMethod:method,
methodProperties:props
})
});

let data = await res.json();

return data.data;

}

/* ПОИСК ГОРОДА */

async function searchCities(query){

let data = await callNP(
"Address",
"searchSettlements",
{
CityName:query,
Limit:20
}
);

return data;

}

/* ЗАГРУЗКА ОТДЕЛЕНИЙ */

async function loadWarehouses(cityRef){

let data = await callNP(
"AddressGeneral",
"getWarehouses",
{
CityRef:cityRef
}
);

return data;

}

/* ПОИСК */

async function handleCityInput(){

let input = document.getElementById("order-city");
let list = document.getElementById("city-suggestions");

let val = input.value;

if(val.length<2){
list.style.display="none";
return;
}

let cities = await searchCities(val);

list.innerHTML="";
list.style.display="block";

cities.forEach(city=>{

let div = document.createElement("div");

div.className="np-suggestion-item";
div.innerText = city.Present;

div.onclick=async ()=>{

input.value = city.Present;

selectedCity = city;

list.style.display="none";

fillWarehouses(city.Ref);

};

list.appendChild(div);

});

}

/* ЗАПОЛНИТЬ ОТДЕЛЕНИЯ */

async function fillWarehouses(cityRef){

let select = document.getElementById("order-address");

select.innerHTML="<option>Завантаження...</option>";

let warehouses = await loadWarehouses(cityRef);

select.innerHTML="<option>Оберіть відділення</option>";

warehouses.forEach(w=>{

let option = document.createElement("option");

option.value = w.Description;
option.innerText = w.Description;

select.appendChild(option);

});

}

/* ОТПРАВКА */

async function submitCheckout(){

let name = document.getElementById("order-name").value;
let surname = document.getElementById("order-surname").value;
let phone = document.getElementById("order-phone").value;
let delivery = document.getElementById("order-delivery").value;

let city = document.getElementById("order-city").value;
let address = document.getElementById("order-address").value;

if(!name||!surname||!phone){
alert("Заповніть всі поля");
return;
}

let order = {

name: name+" "+surname,
phone:phone,
city:city,
delivery:delivery,
address:address,

items:cart,

total:cart.reduce((s,p)=>s+p.price*p.qty,0),

status:"Новий"

};

await saveOrderCRM(order);

cart=[];
saveCart();
renderCart();

closeCheckoutModal();
closeCart();

alert("Замовлення оформлено");

}

/* TOAST */

function showToast(text){

let t = document.createElement("div");

t.style.position="fixed";
t.style.bottom="20px";
t.style.right="20px";
t.style.background="#ff6600";
t.style.color="white";
t.style.padding="12px 20px";
t.style.borderRadius="10px";

t.innerText=text;

document.body.appendChild(t);

setTimeout(()=>t.remove(),2000);

}

/* CLEAR */

function clearCart(){

cart=[];
saveCart();
renderCart();

}

/* SAVE */

function saveCart(){

localStorage.setItem("cart",JSON.stringify(cart));

}

/* INIT */

renderCart();

document.addEventListener("DOMContentLoaded",()=>{

let cityInput = document.getElementById("order-city");

if(cityInput){

cityInput.addEventListener("input",handleCityInput);

}

});