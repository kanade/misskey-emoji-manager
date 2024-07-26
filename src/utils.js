export function setToken(domain, emojiApiToken, driveApiToken) {
  localStorage.setItem(`tokens_${domain}`, JSON.stringify({ emojiApiToken, driveApiToken }));
}

export function getToken(domain) {
  const tokens = localStorage.getItem(`tokens_${domain}`);
  return tokens ? JSON.parse(tokens) : { emojiApiToken: '', driveApiToken: '' };
}

export function getStatusClass(status) {
  if (status >= 200 && status < 300) {
    return 'text-success';
  } else if (status >= 400 && status < 500) {
    return 'text-warning';
  } else {
    return 'text-danger';
  }
}

export function scrollToBottom(app) {
  app.$nextTick(() => {
    const container = app.$refs.logContainer;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}