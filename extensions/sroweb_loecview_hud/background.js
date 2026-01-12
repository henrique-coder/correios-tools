chrome.action.onClicked.addListener((e) => {
  chrome.tabs.create({
    url: "https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/index.php"
  });
});
