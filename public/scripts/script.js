let addPostNav = document.querySelector(".addPostNav");
let addPostClose = document.querySelector(".addPostClose");
let addPost = document.querySelector("#add-post");
let viewPostClose = document.querySelectorAll(".viewPostClose");
let viewPost = document.querySelector(".viewPost");
let library = document.querySelector("#library");
let moon = document.querySelector(".fa-moon");
let sun = document.querySelector(".fa-sun");
let card;

addPostNav.addEventListener("click", () => {
	addPost.style.display = "flex";
});
addPostClose.addEventListener("click", () => {
	addPost.style.display = "none";
});

viewPostClose.forEach((e) =>
	e.addEventListener("click", () => {
		card.style.display = "none";
		library.style.display = "flex";
	})
);

moon.addEventListener("click", () => {
	moon.style.display = "none";
	sun.style.display = "block";
	document.documentElement.style.filter = "invert(100%)";
});

sun.addEventListener("click", () => {
	moon.style.display = "block";
	sun.style.display = "none";
	document.documentElement.style.filter = "invert(0%)";
});

function readMore(id) {
	card = document.querySelector(`.B${id}viewPost`);
	card.style.display = "flex";
	library.style.display = "none";
}
