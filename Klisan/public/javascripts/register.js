const result = {
	login: false,
	pass: false,
	loginErr: "Login already in use",
	passErr: "Passwords is different",
};

function check() {
	if (document.getElementById('pass1').value == document.getElementById('pass2').value) {
		result.pass = true;
		$("#pass1").removeClass("border border-danger");
		$("#pass2").removeClass("border border-danger");
		if(document.getElementById('register').innerText === result.passErr)
			document.getElementById('register').innerText = "";
		if(result.login) 
			document.getElementById('reg').disabled = false;					
	} else {
		result.pass = false;
		$("#pass1").addClass("border border-danger");
		$("#pass2").addClass("border border-danger");
		document.getElementById('reg').disabled = true;
		document.getElementById('register').innerText = result.passErr;
	}
}

function checkLogin() {
	const login = document.getElementById('login').value;
	const path = "checkLogin?login=" + login; 
	fetch(path)
		.then(x => x.json())
		.then(x => {
			if(x.isUnique) {
				result.login = true;
				$("#login").removeClass("border border-danger");
				if(document.getElementById('register').innerText === result.loginErr)
					document.getElementById('register').innerText = "";
				if(result.pass) {
					document.getElementById('reg').disabled = false;
					
				}
			} else {
				result.login = false;
				/* border border-danger */
				$("#login").addClass("border border-danger");
				document.getElementById('reg').disabled = true;
				document.getElementById('register').innerText = result.loginErr;
			}
		})
		.catch(err => console.log(err));
}

function passFormat() {
	document.getElementById('pass1').setCustomValidity('Password must contain letters of different cases and numbers');
}