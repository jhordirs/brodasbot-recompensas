document.addEventListener('DOMContentLoaded', () => {
  // Crear contenedor de notificaciones si no existe
  if (!document.getElementById('notification-container')) {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
  }

  // Función de notificación (idéntica a index.html)
  function showNotification(message, isSuccess = true) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    }, 2000);
  }

  // Elementos DOM
  const serverSelect = document.getElementById('server-select');
  const channelSelect = document.getElementById('channel-select');
  const membersList = document.getElementById('members-list');
  const addMemberBtn = document.getElementById('add-member-btn');
  const addRoleBtn = document.getElementById('add-role-btn');
  const memberModal = document.getElementById('member-modal');
  const roleModal = document.getElementById('role-modal');
  const mentionModal = document.getElementById('mention-modal');
  const closeModals = document.querySelectorAll('.close');
  const membersContainer = document.getElementById('members-container');
  const rolesContainer = document.getElementById('roles-container');
  const mentionContainer = document.getElementById('mention-container');
  const searchMember = document.getElementById('search-member');
  const searchRole = document.getElementById('search-role');
  const searchMention = document.getElementById('search-mention');
  const mentionTitle = document.getElementById('mention-title');
  const headerText = document.getElementById('header-text');
  const footerText = document.getElementById('footer-text');
  const sendBtn = document.getElementById('send-btn');
  const mentionButtons = document.querySelectorAll('.btn-small');
  
  let currentGuildId = null;
  let currentMembers = [];
  let currentMentionType = null;
  let currentTextArea = null;
  let dragSrcElement = null;
  
  // Cargar servidores con opción por defecto
  fetch('/api/guilds')
    .then(res => res.json())
    .then(guilds => {
      guilds.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        serverSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error cargando servidores:', error);
      showNotification('Error cargando servidores', false);
    });
  
  // Al seleccionar servidor
  serverSelect.addEventListener('change', async () => {
    currentGuildId = serverSelect.value;
    if (!currentGuildId) return;
    
    // Cargar canales
    channelSelect.innerHTML = '<option value="">Cargando canales...</option>';
    
    try {
      const channels = await fetch(`/api/guilds/${currentGuildId}/channels`).then(res => res.json());
      channelSelect.innerHTML = '<option value="" disabled selected>Seleccionar canal</option>';
      
      channels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        channelSelect.appendChild(option);
      });
      
      // Cargar recompensas
      loadRewards();
    } catch (error) {
      console.error('Error cargando canales:', error);
      showNotification('Error cargando canales', false);
    }
  });
  
  // Abrir modal para agregar miembros (excluyendo el bot actual)
  addMemberBtn.addEventListener('click', async () => {
    if (!currentGuildId) {
      showNotification('Por favor selecciona un servidor primero', false);
      return;
    }
    
    try {
      const members = await fetch(`/api/guilds/${currentGuildId}/members`).then(res => res.json());
      membersContainer.innerHTML = '';
      
      members.forEach(member => {
        if (currentMembers.some(m => m.id === member.id)) return;
        
        const memberEl = document.createElement('div');
        memberEl.className = 'member-option';
        memberEl.innerHTML = `
          <img src="${member.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${member.name}">
          <span>${member.name} ${member.isBot ? '(Bot)' : ''}</span>
        `;
        
        memberEl.addEventListener('click', () => {
          addToList({
            id: member.id,
            name: member.name,
            points: 0,
            tokens: 0,
            type: 'member',
            isBot: member.isBot
          });
          memberModal.style.display = 'none';
        });
        
        membersContainer.appendChild(memberEl);
      });
      
      memberModal.style.display = 'block';
    } catch (error) {
      console.error('Error cargando miembros:', error);
      showNotification('Error cargando miembros', false);
    }
  });
  
  // Abrir modal para agregar roles
  addRoleBtn.addEventListener('click', async () => {
    if (!currentGuildId) {
      showNotification('Por favor selecciona un servidor primero', false);
      return;
    }
    
    try {
      const roles = await fetch(`/api/guilds/${currentGuildId}/roles`).then(res => res.json());
      rolesContainer.innerHTML = '';
      
      roles.forEach(role => {
        if (currentMembers.some(m => m.id === role.id)) return;
        
        const roleEl = document.createElement('div');
        roleEl.className = 'member-option';
        roleEl.innerHTML = `
          <span>@${role.name}</span>
        `;
        
        roleEl.addEventListener('click', () => {
          addToList({
            id: role.id,
            name: role.name,
            points: 0,
            tokens: 0,
            type: 'role'
          });
          roleModal.style.display = 'none';
        });
        
        rolesContainer.appendChild(roleEl);
      });
      
      roleModal.style.display = 'block';
    } catch (error) {
      console.error('Error cargando roles:', error);
      showNotification('Error cargando roles', false);
    }
  });
  
  // Botones para mencionar
  mentionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!currentGuildId) {
        showNotification('Por favor selecciona un servidor primero', false);
        return;
      }
      
      currentTextArea = document.getElementById(e.target.dataset.target);
      currentMentionType = e.target.classList[1].split('-')[1]; // role, member, etc.
      
      switch(currentMentionType) {
        case 'role':
          openMentionModal('roles', 'Seleccionar rol');
          break;
        case 'member':
          openMentionModal('members', 'Seleccionar miembro');
          break;
        case 'text-channel':
          openMentionModal('text-channels', 'Mencionar Canal de Texto');
          break;
        case 'voice-channel':
          openMentionModal('voice-channels', 'Mencionar Canal de Voz');
          break;
        case 'emoji':
          openMentionModal('emojis', 'Seleccionar emote');
          break;
      }
    });
  });
  
  // Abrir modal para menciones
  async function openMentionModal(type, title) {
    mentionTitle.textContent = title;
    mentionContainer.innerHTML = '';
    
    let items = [];
    
    try {
      switch(type) {
        case 'roles':
          items = await fetch(`/api/guilds/${currentGuildId}/roles`).then(res => res.json());
          break;
        case 'members':
          items = await fetch(`/api/guilds/${currentGuildId}/members`).then(res => res.json());
          break;
        case 'text-channels':
        case 'voice-channels':
          const channels = await fetch(`/api/guilds/${currentGuildId}/channels`).then(res => res.json());
          items = channels.filter(ch => 
            (type === 'text-channels' && ch.type === 0) || 
            (type === 'voice-channels' && ch.type === 2)
          );
          break;
        case 'emojis':
          items = await fetch(`/api/guilds/${currentGuildId}/emojis`).then(res => res.json());
          break;
      }
      
      items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'mention-option';
        
        switch(type) {
          case 'roles':
            itemEl.innerHTML = `<span>@${item.name}</span>`;
            itemEl.addEventListener('click', () => {
              currentTextArea.value += ` <@&${item.id}>`;
              mentionModal.style.display = 'none';
            });
            break;
            
          case 'members':
            itemEl.innerHTML = `
              <img src="${item.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${item.name}">
              <span>${item.name}</span>
            `;
            itemEl.addEventListener('click', () => {
              currentTextArea.value += ` <@${item.id}>`;
              mentionModal.style.display = 'none';
            });
            break;
            
          case 'text-channels':
            itemEl.innerHTML = `<span>#${item.name}</span>`;
            itemEl.addEventListener('click', () => {
              currentTextArea.value += ` <#${item.id}>`;
              mentionModal.style.display = 'none';
            });
            break;
            
          case 'voice-channels':
            itemEl.innerHTML = `<span>🔊 ${item.name}</span>`;
            itemEl.addEventListener('click', () => {
              currentTextArea.value += ` <#${item.id}>`;
              mentionModal.style.display = 'none';
            });
            break;
            
          case 'emojis':
            itemEl.innerHTML = `
              <img src="${item.url}" alt="${item.name}" style="width: 30px; height: 30px;">
              <span>:${item.name}:</span>
            `;
            itemEl.addEventListener('click', () => {
              currentTextArea.value += ` <:${item.name}:${item.id}>`;
              mentionModal.style.display = 'none';
            });
            break;
        }
        
        mentionContainer.appendChild(itemEl);
      });
      
      mentionModal.style.display = 'block';
    } catch (error) {
      console.error(`Error cargando ${type}:`, error);
      showNotification(`Error cargando ${type}`, false);
    }
  }
  
  // Buscar en los modales
  searchMember.addEventListener('input', () => {
    const searchTerm = searchMember.value.toLowerCase();
    const options = membersContainer.querySelectorAll('.member-option');
    
    options.forEach(option => {
      const name = option.querySelector('span').textContent.toLowerCase();
      option.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
  });
  
  searchRole.addEventListener('input', () => {
    const searchTerm = searchRole.value.toLowerCase();
    const options = rolesContainer.querySelectorAll('.member-option');
    
    options.forEach(option => {
      const name = option.querySelector('span').textContent.toLowerCase();
      option.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
  });
  
  searchMention.addEventListener('input', () => {
    const searchTerm = searchMention.value.toLowerCase();
    const options = mentionContainer.querySelectorAll('.mention-option');
    
    options.forEach(option => {
      const name = option.textContent.toLowerCase();
      option.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
  });
  
  // Cerrar modales
  closeModals.forEach(close => {
    close.addEventListener('click', () => {
      memberModal.style.display = 'none';
      roleModal.style.display = 'none';
      mentionModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === memberModal) memberModal.style.display = 'none';
    if (e.target === roleModal) roleModal.style.display = 'none';
    if (e.target === mentionModal) mentionModal.style.display = 'none';
  });
  
  // Añadir a la lista (miembros o roles)
  function addToList(item) {
    if (currentMembers.some(m => m.id === item.id)) return;
    
    currentMembers.push(item);
    renderMembersList();
    saveRewards();
  }
  
  // Renderizar lista de miembros y roles
  function renderMembersList() {
    membersList.innerHTML = '';
    
    currentMembers.forEach((item, index) => {
      const isRole = item.type === 'role';
      const card = document.createElement('div');
      card.className = isRole ? 'role-card' : 'member-card';
      card.draggable = true;
      card.dataset.index = index;
      
      const pointsDisplay = [];
      if (item.tokens >= 3) {
        pointsDisplay.push("🔵🔵🔵 | ¡Máximo alcanzado!");
      } else {
        pointsDisplay.push("🟢".repeat(item.points));
        pointsDisplay.push("⭕".repeat(3 - item.points));
        pointsDisplay.push(` | Tokens: ${item.tokens}/3`);
      }
      
      if (isRole) {
        // Card para roles
        card.innerHTML = `
          <div class="drag-handle">☰</div>
          <div class="member-info">
            <span><@&${item.id}></span>
            <div class="points-display">${pointsDisplay.join('')}</div>
            <div class="member-controls">
              <button class="btn-control btn-point" data-action="add-point" data-id="${item.id}">+ Punto</button>
              <button class="btn-control btn-point" data-action="remove-point" data-id="${item.id}">- Punto</button>
              <button class="btn-control btn-token" data-action="add-token" data-id="${item.id}">+ Token</button>
              <button class="btn-control btn-token" data-action="remove-token" data-id="${item.id}">- Token</button>
              <button class="btn-control btn-remove" data-action="remove" data-id="${item.id}">Eliminar</button>
            </div>
          </div>
        `;
      } else {
        // Card para miembros
        card.innerHTML = `
          <div class="drag-handle">☰</div>
          <div class="member-info">
            <span class="member-list-font">${item.name} ${item.isBot ? '(Bot)' : ''}</span>
            <div class="points-display">${pointsDisplay.join('')}</div>
            <div class="member-controls">
              <button class="btn-control btn-point" data-action="add-point" data-id="${item.id}">+ Punto</button>
              <button class="btn-control btn-point" data-action="remove-point" data-id="${item.id}">- Punto</button>
              <button class="btn-control btn-token" data-action="add-token" data-id="${item.id}">+ Token</button>
              <button class="btn-control btn-token" data-action="remove-token" data-id="${item.id}">- Token</button>
              <button class="btn-control btn-remove" data-action="remove" data-id="${item.id}">Eliminar</button>
            </div>
          </div>
        `;
      }
      
      // Eventos de drag and drop
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('drop', handleDrop);
      card.addEventListener('dragend', handleDragEnd);
      card.addEventListener('dragenter', handleDragEnter);
      card.addEventListener('dragleave', handleDragLeave);
      
      membersList.appendChild(card);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', handleItemAction);
    });
  }
  
  // Funciones para drag and drop
  function handleDragStart(e) {
    dragSrcElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }
  
  function handleDragEnter(e) {
    this.classList.add('over');
  }
  
  function handleDragLeave(e) {
    this.classList.remove('over');
  }
  
  function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    if (dragSrcElement !== this) {
      // Obtener índices
      const fromIndex = parseInt(dragSrcElement.dataset.index);
      const toIndex = parseInt(this.dataset.index);
      
      // Mover elemento en el array
      const movedItem = currentMembers.splice(fromIndex, 1)[0];
      currentMembers.splice(toIndex, 0, movedItem);
      
      // Actualizar lista
      renderMembersList();
      saveRewards();
    }
    
    this.classList.remove('over');
    return false;
  }
  
  function handleDragEnd(e) {
    document.querySelectorAll('.member-card, .role-card').forEach(card => {
      card.classList.remove('dragging');
      card.classList.remove('over');
    });
  }
  
  // Manejar acciones de miembros y roles
  function handleItemAction(e) {
    const action = e.target.dataset.action;
    const itemId = e.target.dataset.id;
    const item = currentMembers.find(i => i.id === itemId);
    
    if (!item) return;
    
    if (action === 'remove') {
      currentMembers = currentMembers.filter(i => i.id !== itemId);
      renderMembersList();
      saveRewards();
      return;
    }
    
    // Tanto miembros como roles pueden tener puntos/tokens
    switch(action) {
      case 'add-point':
        if (item.tokens >= 3) break;
        if (item.points < 3) item.points++;
        if (item.points === 3) {
          item.points = 0;
          item.tokens = Math.min(item.tokens + 1, 3);
        }
        break;
      case 'remove-point':
        if (item.points > 0) {
          item.points--;
        } else if (item.tokens > 0) {
          item.tokens--;
          item.points = 2;
        }
        break;
      case 'add-token':
        item.tokens = Math.min(item.tokens + 1, 3);
        break;
      case 'remove-token':
        if (item.tokens > 0) item.tokens--;
        break;
    }
    
    renderMembersList();
    saveRewards();
  }
  
  // Cargar recompensas
  async function loadRewards() {
    if (!currentGuildId) return;
    
    try {
      const rewards = await fetch(`/api/rewards/${currentGuildId}`).then(res => res.json());
      currentMembers = rewards.members || [];
      headerText.value = rewards.headerText || '';
      footerText.value = rewards.footerText || '';
      
      renderMembersList();
    } catch (error) {
      console.error('Error cargando recompensas:', error);
      showNotification('Error cargando recompensas', false);
    }
  }
  
  // Guardar recompensas
  function saveRewards() {
    if (!currentGuildId) return;
    
    fetch(`/api/rewards/${currentGuildId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        members: currentMembers,
        headerText: headerText.value,
        footerText: footerText.value
      })
    })
    .catch(error => {
      console.error('Error guardando recompensas:', error);
      showNotification('Error guardando recompensas', false);
    });
  }
  
  // Enviar embed a Discord
  sendBtn.addEventListener('click', async () => {
    if (!currentGuildId || !channelSelect.value) {
      showNotification('Por favor selecciona un servidor y un canal', false);
      return;
    }
    
    saveRewards();
    
    try {
      await fetch(`/api/send/${currentGuildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channelSelect.value })
      });
      
      showNotification('Embed enviado con éxito!');
    } catch (error) {
      console.error('Error enviando embed:', error);
      showNotification(`Error al enviar el embed: ${error.message}`, false);
    }
  });
  
  // Guardar cambios automáticamente
  headerText.addEventListener('input', saveRewards);
  footerText.addEventListener('input', saveRewards);
});