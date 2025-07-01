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
    const pdfUploadInput = document.getElementById('pdfUpload');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const sortOrderSelect = document.getElementById('sortOrder');
    const recordsList = document.getElementById('recordsList');
    const noRecordsMessage = document.querySelector('.no-records-message');

    const detailPatientName = document.getElementById('detailPatientName');
    const detailAppointmentDate = document.getElementById('detailAppointmentDate');
    const detailRecordRelate = document.getElementById('detailRecordRelate');
    const detailMedicalRecord = document.getElementById('detailMedicalRecord');
    const viewPdfButton = document.getElementById('viewPdfButton');
    const noPdfMessage = document.getElementById('noPdfMessage');
    const followUpsList = document.getElementById('followUpsList');
    const noFollowUpsMessage = document.querySelector('.no-followups-message');

    const followUpPatientNameTitle = document.getElementById('followUpPatientNameTitle');
    const followUpDateInput = document.getElementById('followUpDate');
    const followUpTextarea = document.getElementById('followUpText');
    const modalFollowUpDate = document.getElementById('modalFollowUpDate');
    const modalFollowUpText = document.getElementById('modalFollowUpText');

    // Referências para o upload de PDF no formulário de acompanhamento
    const followUpPdfUploadInput = document.getElementById('followUpPdfUpload');
    const followUpFileNameDisplay = document.getElementById('followUpFileNameDisplay');
    let selectedFollowUpPdfFile = null;

    let prontuarios = [];
    let currentRecordId = null;
    let currentPatientName = '';
    let selectedPdfFile = null;

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
        pdfUploadInput.value = '';
        fileNameDisplay.textContent = '';
        selectedPdfFile = null;
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

        // Lógica para exibir o botão de visualizar PDF
        if (record.pdfDataUrl && record.pdfFileName) {
            viewPdfButton.style.display = 'inline-flex';
            noPdfMessage.style.display = 'none';
            viewPdfButton.dataset.pdfUrl = record.pdfDataUrl;
        } else {
            viewPdfButton.style.display = 'none';
            noPdfMessage.style.display = 'block';
            viewPdfButton.dataset.pdfUrl = '';
        }

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
        // Limpa o campo de upload de PDF do acompanhamento
        followUpPdfUploadInput.value = '';
        followUpFileNameDisplay.textContent = '';
        selectedFollowUpPdfFile = null;
        showContainer(followUpFormContainer);
    };

    const showFollowUpModal = (date, text, pdfDataUrl) => {
        modalFollowUpDate.textContent = `Acompanhamento de: ${date}`;
        modalFollowUpText.textContent = text;
        followUpModal.style.display = 'flex';

        // Se houver PDF no acompanhamento, adiciona um botão para visualizá-lo no modal
        if (pdfDataUrl) {
            const viewPdfInModalButton = document.createElement('button');
            viewPdfInModalButton.className = 'action-button view-pdf-button';
            viewPdfInModalButton.textContent = 'Ver PDF Anexado';
            viewPdfInModalButton.style.marginTop = '10px';
            viewPdfInModalButton.onclick = () => {
                openPdfModal(pdfDataUrl);
            };
            modalFollowUpText.appendChild(viewPdfInModalButton);
        }
    };

    const hideFollowUpModal = () => {
        followUpModal.style.display = 'none';
        // Limpa o botão de PDF do modal para o próximo acompanhamento
        const viewPdfInModalButton = followUpModal.querySelector('.view-pdf-button');
        if (viewPdfInModalButton) {
            viewPdfInModalButton.remove();
        }
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

            li.innerHTML =
                `<div class="record-item-info">
                    <h3>${record.patientName}</h3>
                    <p><strong>Atendimento:</strong> ${formatDate(record.appointmentDate)} | <strong>Modificado:</strong> ${record.lastModified}</p>
                    <p>${record.recordRelate ? (record.recordRelate.length > 100 ? record.recordRelate.substring(0, 100) + '...' : record.recordRelate) : 'Sem relato inicial.'}</p>
                    ${record.pdfFileName ? `<p style="font-style: italic; color: #666;"><small>PDF Anexado: ${record.pdfFileName}</small></p>` : ''}
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

        // INÍCIO DA MODIFICAÇÃO PRINCIPAL PARA ALINHAR DATA E PDF
        followUps.forEach((f, index) => {
            const li = document.createElement('li');
            li.className = 'followup-item';
            li.dataset.index = index; // Adiciona o índice como data attribute para exclusão

            // Estrutura o HTML com base na sua classe CSS .followup-content-wrapper
            // A data e o link do PDF agora estão juntos no mesmo contêiner Flexbox
            li.innerHTML = `
                <div class="followup-content-wrapper">
                    <span class="followup-date-display">${formatDate(f.date)}:</span>
                    ${f.pdfFileName ? `
                        <a href="#" class="view-followup-pdf" data-pdf-url="${f.pdfDataUrl}" data-filename="${f.pdfFileName}">
                            ${f.pdfFileName}
                        </a>` : ''}
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
            li.onclick = () => showFollowUpModal(formatDate(f.date), f.text, f.pdfDataUrl);
            followUpsList.appendChild(li);
        });
        // FIM DA MODIFICAÇÃO PRINCIPAL

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

    const saveProntuario = () => {
        const patientName = patientNameInput.value.trim();
        const recordRelate = recordRelateInput.value.trim();
        const appointmentDate = appointmentDateInput.value;
        const medicalRecord = medicalRecordInput.value.trim();

        if (!patientName || !appointmentDate) {
            alert('Por favor, preencha Nome do Paciente e Data do Atendimento.');
            return;
        }

        const createRecord = (pdfDataUrl = null, pdfFileName = null) => {
            const newProntuario = {
                id: generateId(),
                patientName,
                recordRelate,
                appointmentDate,
                medicalRecord: medicalRecord || '',
                pdfDataUrl: pdfDataUrl,
                pdfFileName: pdfFileName,
                lastModified: new Date().toLocaleDateString('pt-BR'),
                followUps: []
            };

            prontuarios.push(newProntuario);
            saveProntuarios();
            showList();
        };

        if (selectedPdfFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                createRecord(e.target.result, selectedPdfFile.name);
            };
            reader.onerror = (error) => {
                console.error('Erro ao ler o arquivo PDF:', error);
                alert('Erro ao ler o arquivo PDF. Tente novamente ou use um arquivo menor.');
                createRecord();
            };
            reader.readAsDataURL(selectedPdfFile);
        } else {
            createRecord();
        }
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

    // MODIFICAÇÃO: Função saveFollowUp atualizada para lidar com PDF
    const saveFollowUp = async () => {
        const followUpDate = followUpDateInput.value;
        const followUpText = followUpTextarea.value.trim();

        const recordToUpdate = prontuarios.find(p => p.id === currentRecordId);
        if (!recordToUpdate) {
            alert('Erro: Prontuário não encontrado.');
            showList();
            return;
        }

        let pdfDataUrl = null;
        let pdfFileName = null;

        if (selectedFollowUpPdfFile) {
            const readPdfFile = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(selectedFollowUpPdfFile);
            });

            try {
                pdfDataUrl = await readPdfFile;
                pdfFileName = selectedFollowUpPdfFile.name;
            } catch (error) {
                console.error('Erro ao ler o arquivo PDF do acompanhamento:', error);
                alert('Erro ao ler o arquivo PDF. O acompanhamento será salvo sem o anexo.');
            }
        }

        recordToUpdate.followUps.push({
            date: followUpDate,
            text: followUpText,
            pdfDataUrl: pdfDataUrl,
            pdfFileName: pdfFileName
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

    viewPdfButton.addEventListener('click', () => {
        const pdfUrl = viewPdfButton.dataset.pdfUrl;
        if (pdfUrl) {
            openPdfModal(pdfUrl);
        } else {
            alert('Nenhum PDF anexado para este prontuário.');
        }
    });

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

    // Event listener para o input de arquivo do prontuário principal
    pdfUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            selectedPdfFile = file;
            fileNameDisplay.textContent = `Arquivo selecionado: ${file.name}`;
        } else {
            selectedPdfFile = null;
            pdfUploadInput.value = '';
            fileNameDisplay.textContent = 'Por favor, selecione um arquivo PDF.';
            alert('Por favor, selecione um arquivo PDF.');
        }
    });

    // Event listener para o input de arquivo do acompanhamento
    followUpPdfUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            selectedFollowUpPdfFile = file;
            followUpFileNameDisplay.textContent = `Arquivo selecionado: ${file.name}`;
        } else {
            selectedFollowUpPdfFile = null;
            followUpPdfUploadInput.value = '';
            followUpFileNameDisplay.textContent = 'Por favor, selecione um arquivo PDF.';
            alert('Por favor, selecione um arquivo PDF.');
        }
    });

    // Inicialização
    loadProntuarios();
    showList(); // Garante que a lista e a imagem sejam mostradas na carga inicial
});