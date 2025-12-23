chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamento/index.php"
  });
});
