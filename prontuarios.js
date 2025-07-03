/* eslint-disable no-unused-vars */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './build/pdf.worker.mjs';
    } else {
        console.error('PDF.js library not loaded. Please check the <script> tag in your HTML file.');
    }

    // Referências aos elementos HTML
    const headerUsername = document.getElementById('headerUsername');

    const recordListContainer = document.getElementById('recordListContainer');
    const recordFormContainer = document.getElementById('recordFormContainer');
    const recordDetailContainer = document.getElementById('recordDetailContainer');
    const followUpFormContainer = document.getElementById('followUpFormContainer');
    const followUpModal = document.getElementById('followUpModal');
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewerIframe = document.getElementById('pdfViewerIframe');
    const closePdfModal = document.getElementById('closePdfModal');

    // Referência ao container da imagem
    const bottomLeftImageContainer = document.getElementById('bottomLeftImageContainer');


    const newRecordButton = document.getElementById('newRecordButton');
    const saveRecordButton = document.getElementById('saveRecordButton');
    const cancelRecordButton = document.getElementById('cancelRecordButton');
    const backToListButton = document.getElementById('backToListButton');
    const addFollowUpButton = document.getElementById('addFollowUpButton');
    const saveFollowUpButton = document.getElementById('saveFollowUpButton');
    const cancelFollowUpButton = document.getElementById('cancelFollowUpButton');
    const closeFollowUpModal = document.getElementById('closeFollowUpModal');
    const deleteRecordButton = document.getElementById('deleteRecordButton');

    const patientNameInput = document.getElementById('patientName');
    const recordRelateInput = document.getElementById('recordRelate');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const medicalRecordInput = document.getElementById('medicalRecord');
    
    // Antigo pdfUploadInput e fileNameDisplay
    const pdfUploadInput = document.getElementById('pdfUpload');
    // NOVO: Elemento para exibir nomes de múltiplos arquivos do registro principal
    const selectedRecordPdfsDisplay = document.getElementById('selectedRecordPdfsDisplay'); 

    const sortOrderSelect = document.getElementById('sortOrder');
    const recordsList = document.getElementById('recordsList');
    const noRecordsMessage = document.querySelector('.no-records-message');

    const detailPatientName = document.getElementById('detailPatientName');
    const detailAppointmentDate = document.getElementById('detailAppointmentDate');
    const detailRecordRelate = document.getElementById('detailRecordRelate');
    const detailMedicalRecord = document.getElementById('detailMedicalRecord');
    
    // Antigos viewPdfButton e noPdfMessage
    const pdfsDisplayArea = document.getElementById('pdfsDisplayArea'); // Novo container para listar PDFs do registro
    const recordPdfsList = document.getElementById('recordPdfsList'); // UL para listar os PDFs do registro
    const noRecordPdfsMessage = document.getElementById('noRecordPdfsMessage'); // Mensagem se não houver PDFs

    const followUpsList = document.getElementById('followUpsList');
    const noFollowUpsMessage = document.querySelector('.no-followups-message');

    const followUpPatientNameTitle = document.getElementById('followUpPatientNameTitle');
    const followUpDateInput = document.getElementById('followUpDate');
    const followUpTextarea = document.getElementById('followUpText');
    const modalFollowUpDate = document.getElementById('modalFollowUpDate');
    const modalFollowUpText = document.getElementById('modalFollowUpText');

    // Referências para o upload de PDF no formulário de acompanhamento
    const followUpPdfUploadInput = document.getElementById('followUpPdfUpload');
    // NOVO: Elemento para exibir nomes de múltiplos arquivos do acompanhamento
    const selectedFollowUpPdfsDisplay = document.getElementById('selectedFollowUpPdfsDisplay'); 

    // MODIFICAÇÃO CHAVE: Variáveis para armazenar múltiplos arquivos
    let currentRecordPdfFiles = []; // Array para FileList do registro principal
    let currentFollowupPdfFiles = []; // Array para FileList do acompanhamento

    let prontuarios = [];
    let currentRecordId = null;
    let currentPatientName = '';
    
    // Remover selectedPdfFile e selectedFollowUpPdfFile, pois agora usamos arrays

    const currentUser = "Luciana Viana";

    // --- Funções de Conversão ---
    function dataURLToBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // --- Funções de Exibição/Ocultação de Containers ---
    const showContainer = (container) => {
        const allContainers = [recordListContainer, recordFormContainer, recordDetailContainer, followUpFormContainer];
        allContainers.forEach(c => c.style.display = 'none');
        
        // Esconde a imagem por padrão
        if (bottomLeftImageContainer) {
            bottomLeftImageContainer.style.display = 'none';
        }

        container.style.display = 'block';

        // Se o container exibido for o da lista de prontuários, mostra a imagem
        if (container === recordListContainer && bottomLeftImageContainer) {
            bottomLeftImageContainer.style.display = 'block';
        }
    };

    const showList = () => {
        showContainer(recordListContainer);
        renderProntuarios();
    };

    const showNewRecordForm = () => {
        patientNameInput.value = '';
        recordRelateInput.value = '';
        appointmentDateInput.value = new Date().toISOString().split('T')[0];
        medicalRecordInput.value = '';
        
        // MODIFICADO: Resetar inputs de arquivo e exibições
        pdfUploadInput.value = '';
        selectedRecordPdfsDisplay.textContent = '';
        currentRecordPdfFiles = []; // Limpa o array de arquivos
        
        currentRecordId = null;
        showContainer(recordFormContainer);
    };

    const showRecordDetails = (record) => {
        currentRecordId = record.id;
        currentPatientName = record.patientName;

        detailPatientName.textContent = record.patientName;
        detailAppointmentDate.textContent = formatDate(record.appointmentDate);
        detailRecordRelate.textContent = record.recordRelate || 'N/A';
        detailMedicalRecord.textContent = record.medicalRecord || 'Não preenchido.';

        // MODIFICADO: Lógica para exibir múltiplos PDFs do registro principal
        renderRecordPdfs(record.recordPdfs); // Nova função para renderizar múltiplos PDFs do registro

        renderFollowUps(record.followUps);
        showContainer(recordDetailContainer);
    };

    const showAddFollowUpForm = () => {
        if (!currentRecordId) {
            alert('Erro: Nenhum prontuário selecionado para adicionar acompanhamento.');
            showList();
            return;
        }
        followUpPatientNameTitle.textContent = `Novo Acompanhamento para ${currentPatientName}`;
        followUpDateInput.value = new Date().toISOString().split('T')[0];
        followUpTextarea.value = '';
        
        // MODIFICADO: Limpa o campo de upload de PDF do acompanhamento e exibições
        followUpPdfUploadInput.value = '';
        selectedFollowUpPdfsDisplay.textContent = '';
        currentFollowupPdfFiles = []; // Limpa o array de arquivos
        
        showContainer(followUpFormContainer);
    };

    const showFollowUpModal = (date, text, pdfs) => {
        modalFollowUpDate.textContent = `Acompanhamento de: ${date}`;
        modalFollowUpText.innerHTML = text; // Usar innerHTML para permitir o botão/links

        // Limpa qualquer botão de PDF anterior no modal
        const existingPdfButtons = modalFollowUpText.querySelectorAll('.view-pdf-button');
        existingPdfButtons.forEach(btn => btn.remove());

        // Se houver PDFs no acompanhamento, adiciona um botão para visualizá-los no modal
        if (pdfs && pdfs.length > 0) {
            pdfs.forEach(pdf => {
                const viewPdfInModalButton = document.createElement('button');
                viewPdfInModalButton.className = 'action-button view-pdf-button';
                viewPdfInModalButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" style="vertical-align: middle; margin-right: 5px;">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg> ${pdf.fileName}`;
                viewPdfInModalButton.style.marginTop = '10px';
                viewPdfInModalButton.style.marginRight = '10px'; // Espaçamento entre botões se houver múltiplos
                viewPdfInModalButton.onclick = (e) => {
                    e.stopPropagation(); // Evita que o clique feche o modal pai
                    openPdfModal(pdf.dataUrl);
                };
                modalFollowUpText.appendChild(viewPdfInModalButton);
            });
        }
        followUpModal.style.display = 'flex';
    };


    const hideFollowUpModal = () => {
        followUpModal.style.display = 'none';
        // Limpa o botão de PDF do modal para o próximo acompanhamento
        const viewPdfInModalButtons = followUpModal.querySelectorAll('.view-pdf-button');
        viewPdfInModalButtons.forEach(btn => btn.remove());
    };

    const openPdfModal = (pdfDataUrl) => {
        const viewerPath = 'web/viewer.html';

        const blob = dataURLToBlob(pdfDataUrl);
        const blobUrl = URL.createObjectURL(blob);

        pdfViewerIframe.src = `${viewerPath}?file=${encodeURIComponent(blobUrl)}`;
        pdfModal.style.display = 'flex';
    };

    const closePdfModalHandler = () => {
        pdfModal.style.display = 'none';
        const currentSrc = pdfViewerIframe.src;
        pdfViewerIframe.src = '';
        if (currentSrc.startsWith('blob:')) {
            URL.revokeObjectURL(currentSrc);
        }
    };

    // --- Gerenciamento de Dados (LocalStorage) por usuário ---
    const getProntuariosForCurrentUser = () => {
        return JSON.parse(localStorage.getItem('prontuariosApp_LucianaVianaProntuarios') || '[]');
    };

    const saveProntuariosForCurrentUser = (userProntuarios) => {
        localStorage.setItem('prontuariosApp_LucianaVianaProntuarios', JSON.stringify(userProntuarios));
    };

    const loadProntuarios = () => {
        prontuarios = getProntuariosForCurrentUser();
    };

    const saveProntuarios = () => {
        saveProntuariosForCurrentUser(prontuarios);
    };

    // --- Funções de Renderização ---
    const renderProntuarios = () => {
        recordsList.innerHTML = '';

        if (prontuarios.length === 0) {
            recordsList.appendChild(noRecordsMessage);
            noRecordsMessage.style.display = 'block';
            return;
        } else {
            noRecordsMessage.style.display = 'none';
        }

        const sortedProntuarios = sortProntuarios(prontuarios, sortOrderSelect.value);

        sortedProntuarios.forEach(record => {
            const li = document.createElement('li');
            li.className = 'record-item';
            li.dataset.id = record.id;

            // Adaptação para múltiplos PDFs no item da lista (mostrar apenas count ou nomes parciais)
            const pdfInfo = record.recordPdfs && record.recordPdfs.length > 0
                ? `<p style="font-style: italic; color: #666;"><small>PDF(s) Anexado(s): ${record.recordPdfs.length} arquivo(s)</small></p>`
                : '';

            li.innerHTML =
                `<div class="record-item-info">
                    <h3>${record.patientName}</h3>
                    <p><strong>Atendimento:</strong> ${formatDate(record.appointmentDate)} | <strong>Modificado:</strong> ${record.lastModified}</p>
                    <p>${record.recordRelate ? (record.recordRelate.length > 100 ? record.recordRelate.substring(0, 100) + '...' : record.recordRelate) : 'Sem relato inicial.'}</p>
                    ${pdfInfo}
                </div>
                <div class="record-item-actions">
                    <button class="action-button view-button" data-id="${record.id}">Ver Detalhes</button>
                    <button class="action-button delete-record-item-button" data-id="${record.id}">Excluir</button>
                </div>`;

            recordsList.appendChild(li);
        });

        document.querySelectorAll('.view-button').forEach(button => {
            button.onclick = (e) => {
                const id = e.target.dataset.id;
                const record = prontuarios.find(p => p.id === id);
                if (record) {
                    showRecordDetails(record);
                }
            };
        });

        document.querySelectorAll('.delete-record-item-button').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                const idToDelete = e.target.dataset.id;
                deleteProntuario(idToDelete);
            };
        });
    };

    // NOVA FUNÇÃO: Renderiza os PDFs anexados ao registro principal
    const renderRecordPdfs = (pdfs) => {
        recordPdfsList.innerHTML = ''; // Limpa a lista existente

        if (!pdfs || pdfs.length === 0) {
            noRecordPdfsMessage.style.display = 'block';
            return;
        } else {
            noRecordPdfsMessage.style.display = 'none';
        }

        pdfs.forEach((pdf, index) => {
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `
                <button class="action-button view-pdf-button" data-pdf-url="${pdf.dataUrl}" data-filename="${pdf.fileName}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" style="vertical-align: middle; margin-right: 5px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    ${pdf.fileName}
                </button>
            `;
            recordPdfsList.appendChild(li);
        });

        // Adiciona event listeners para os novos botões de PDF
        recordPdfsList.querySelectorAll('.view-pdf-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const pdfUrl = event.currentTarget.dataset.pdfUrl;
                if (pdfUrl) {
                    openPdfModal(pdfUrl);
                }
            });
        });
    };


    const renderFollowUps = (followUps) => {
        followUpsList.innerHTML = '';
        if (followUps.length === 0) {
            followUpsList.appendChild(noFollowUpsMessage);
            noFollowUpsMessage.style.display = 'block';
            return;
        } else {
            noFollowUpsMessage.style.display = 'none';
        }

        followUps.sort((a, b) => new Date(b.date) - new Date(a.date));

        followUps.forEach((f, index) => {
            const li = document.createElement('li');
            li.className = 'followup-item';
            li.dataset.index = index; // Adiciona o índice como data attribute para exclusão

            // Construir links para múltiplos PDFs de acompanhamento
            let pdfLinksHtml = '';
            if (f.pdfs && f.pdfs.length > 0) {
                pdfLinksHtml = f.pdfs.map(pdf => `
                    <a href="#" class="view-followup-pdf" data-pdf-url="${pdf.dataUrl}" data-filename="${pdf.fileName}" style="margin-right: 5px;">
                        ${pdf.fileName}
                    </a>
                `).join('');
            }
            
            li.innerHTML = `
                <div class="followup-content-wrapper">
                    <span class="followup-date-display">${formatDate(f.date)}:</span>
                    ${pdfLinksHtml}
                    <span class="followup-text-preview" style="${f.text ? 'display: block;' : 'display: none;'}">
                        ${f.text.substring(0, 150)}${f.text.length > 150 ? '...' : ''}
                    </span>
                </div>
                <div class="followup-actions">
                    <button class="action-button delete-followup-button" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;

            // Agora, o evento de clique deve ser adicionado ao contêiner que queremos que seja clicável (seja o li inteiro ou uma parte)
            // O `li` ainda é clicável para abrir o modal de texto
            li.onclick = (e) => {
                // Impede que o clique nos links de PDF ou botão de exclusão ative o modal de texto
                if (!e.target.closest('.view-followup-pdf') && !e.target.closest('.delete-followup-button')) {
                    showFollowUpModal(formatDate(f.date), f.text, f.pdfs);
                }
            };
            followUpsList.appendChild(li);
        });

        // Adiciona event listeners para os links de PDF e botões de exclusão
        // Estes eventos são adicionados APÓS a criação dos elementos
        document.querySelectorAll('.view-followup-pdf').forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation(); // Impede que o modal do acompanhamento seja aberto
                const pdfUrl = event.currentTarget.dataset.pdfUrl;
                if (pdfUrl) {
                    openPdfModal(pdfUrl);
                }
            });
        });
        
        document.querySelectorAll('.delete-followup-button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Impede que o modal do acompanhamento seja aberto
                // Encontra o `li` pai para obter o data-index
                const li = event.currentTarget.closest('.followup-item');
                if (li) {
                    const followUpIndex = parseInt(li.dataset.index);
                    deleteFollowUp(currentRecordId, followUpIndex);
                }
            });
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // --- Funções de Ação ---
    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // MODIFICADO: Função saveProntuario para lidar com múltiplos PDFs
    const saveProntuario = async () => {
        const patientName = patientNameInput.value.trim();
        const recordRelate = recordRelateInput.value.trim();
        const appointmentDate = appointmentDateInput.value;
        const medicalRecord = medicalRecordInput.value.trim();

        if (!patientName || !appointmentDate) {
            alert('Por favor, preencha Nome do Paciente e Data do Atendimento.');
            return;
        }

        // Lógica para ler múltiplos PDFs do registro principal
        const recordPdfsToSave = [];
        for (const file of currentRecordPdfFiles) {
            if (file.type === 'application/pdf') {
                try {
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(file);
                    });
                    recordPdfsToSave.push({ dataUrl, fileName: file.name });
                } catch (error) {
                    console.error(`Erro ao ler o arquivo PDF ${file.name}:`, error);
                    alert(`Erro ao ler o arquivo PDF "${file.name}". Ele não será anexado.`);
                }
            } else {
                alert(`O arquivo "${file.name}" não é um PDF e será ignorado.`);
            }
        }
        
        const newProntuario = {
            id: generateId(),
            patientName,
            recordRelate,
            appointmentDate,
            medicalRecord: medicalRecord || '',
            recordPdfs: recordPdfsToSave, // Agora é um array de objetos {dataUrl, fileName}
            lastModified: new Date().toLocaleDateString('pt-BR'),
            followUps: []
        };

        prontuarios.push(newProntuario);
        saveProntuarios();
        showList();
    };

    const deleteProntuario = (idToDelete) => {
        if (confirm('Tem certeza que deseja excluir este prontuário? Esta ação não pode ser desfeita.')) {
            prontuarios = prontuarios.filter(p => p.id !== idToDelete);
            saveProntuarios();
            showList();
        }
    };

    // NOVO: Função para excluir um acompanhamento específico
    const deleteFollowUp = (recordId, followUpIndex) => {
        const record = prontuarios.find(p => p.id === recordId);
        if (!record) return;

        if (confirm('Tem certeza que deseja excluir este acompanhamento? Esta ação não pode ser desfeita.')) {
            // Remove o acompanhamento do array pelo seu índice
            record.followUps.splice(followUpIndex, 1);
            
            // Atualiza a data de última modificação do prontuário
            record.lastModified = new Date().toLocaleDateString('pt-BR');

            // Salva as alterações no LocalStorage
            saveProntuarios();
            
            // Re-renderiza a lista de acompanhamentos para refletir a exclusão
            showRecordDetails(record);
            
            alert('Acompanhamento excluído com sucesso.');
        }
    };

    // MODIFICAÇÃO: Função saveFollowUp atualizada para lidar com múltiplos PDFs
    const saveFollowUp = async () => {
        const followUpDate = followUpDateInput.value;
        const followUpText = followUpTextarea.value.trim();

        const recordToUpdate = prontuarios.find(p => p.id === currentRecordId);
        if (!recordToUpdate) {
            alert('Erro: Prontuário não encontrado.');
            showList();
            return;
        }

        // Lógica para ler múltiplos PDFs do acompanhamento
        const followUpPdfsToSave = [];
        for (const file of currentFollowupPdfFiles) {
            if (file.type === 'application/pdf') {
                try {
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(file);
                    });
                    followUpPdfsToSave.push({ dataUrl, fileName: file.name });
                } catch (error) {
                    console.error(`Erro ao ler o arquivo PDF ${file.name}:`, error);
                    alert(`Erro ao ler o arquivo PDF "${file.name}". Ele não será anexado.`);
                }
            } else {
                alert(`O arquivo "${file.name}" não é um PDF e será ignorado.`);
            }
        }

        recordToUpdate.followUps.push({
            date: followUpDate,
            text: followUpText,
            pdfs: followUpPdfsToSave // Agora é um array de objetos {dataUrl, fileName}
        });
        recordToUpdate.lastModified = new Date().toLocaleDateString('pt-BR');
        saveProntuarios();
        showRecordDetails(recordToUpdate);
    };

    // --- Funções de Ordenação ---
    const sortProntuarios = (arr, sortOrder) => {
        switch (sortOrder) {
            case 'lastModifiedDesc':
                return [...arr].sort((a, b) => {
                    const dateA = a.lastModified.split('/').reverse().join('-');
                    const dateB = b.lastModified.split('/').reverse().join('-');
                    return new Date(dateB) - new Date(dateA);
                });
            case 'appointmentDateDesc':
                return [...arr].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
            case 'appointmentDateAsc':
                return [...arr].sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
            case 'patientNameAsc':
                return [...arr].sort((a, b) => a.patientName.localeCompare(b.patientName));
            case 'patientNameDesc':
                return [...arr].sort((a, b) => b.patientName.localeCompare(a.patientName));
            default:
                return arr;
        }
    };

    // --- Event Listeners ---
    newRecordButton.addEventListener('click', showNewRecordForm);
    saveRecordButton.addEventListener('click', saveProntuario);
    cancelRecordButton.addEventListener('click', showList);
    backToListButton.addEventListener('click', showList);
    addFollowUpButton.addEventListener('click', showAddFollowUpForm);
    saveFollowUpButton.addEventListener('click', saveFollowUp);
    cancelFollowUpButton.addEventListener('click', () => {
        const record = prontuarios.find(p => p.id === currentRecordId);
        if (record) showRecordDetails(record);
        else showList();
    });
    deleteRecordButton.addEventListener('click', () => deleteProntuario(currentRecordId));
    sortOrderSelect.addEventListener('change', renderProntuarios);
    closeFollowUpModal.addEventListener('click', hideFollowUpModal);

    // O antigo viewPdfButton não existe mais, a lógica de clique foi movida para renderRecordPdfs
    // viewPdfButton.addEventListener('click', ...); 

    closePdfModal.addEventListener('click', closePdfModalHandler);

    // Evento de clique fora dos modais para fechar
    window.addEventListener('click', (event) => {
        if (event.target === followUpModal) {
            hideFollowUpModal();
        }
        if (event.target === pdfModal) {
            closePdfModalHandler();
        }
    });

    // NOVO Event listener para o input de arquivo do prontuário principal (MÚLTIPLOS)
    pdfUploadInput.addEventListener('change', (event) => {
        // Filtra para garantir que apenas PDFs sejam adicionados
        const files = Array.from(event.target.files).filter(file => file.type === 'application/pdf');
        
        if (files.length > 0) {
            currentRecordPdfFiles = files;
            const fileNames = files.map(file => file.name).join(', ');
            selectedRecordPdfsDisplay.textContent = `Arquivo(s) selecionado(s): ${fileNames}`;
        } else {
            currentRecordPdfFiles = [];
            pdfUploadInput.value = ''; // Limpa o input
            selectedRecordPdfsDisplay.textContent = 'Nenhum arquivo PDF selecionado ou arquivos inválidos.';
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    });

    // NOVO Event listener para o input de arquivo do acompanhamento (MÚLTIPLOS)
    followUpPdfUploadInput.addEventListener('change', (event) => {
        // Filtra para garantir que apenas PDFs sejam adicionados
        const files = Array.from(event.target.files).filter(file => file.type === 'application/pdf');

        if (files.length > 0) {
            currentFollowupPdfFiles = files;
            const fileNames = files.map(file => file.name).join(', ');
            selectedFollowUpPdfsDisplay.textContent = `Arquivo(s) selecionado(s): ${fileNames}`;
        } else {
            currentFollowupPdfFiles = [];
            followUpPdfUploadInput.value = ''; // Limpa o input
            selectedFollowUpPdfsDisplay.textContent = 'Nenhum arquivo PDF selecionado ou arquivos inválidos.';
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    });

    // --- Inicialização ---
    loadProntuarios();
    showList(); // Mostra a lista inicialmente
});

// A função formatDate já existe e está correta.
// A lógica para `today` já existe no HTML.