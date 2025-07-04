/* eslint-disable no-unused-vars */
document.addEventListener('DOMContentLoaded', () => {
    // Check if PDF.js library is loaded
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './build/pdf.worker.mjs';
    } else {
        console.error('PDF.js library not loaded. Please check the <script> tag in your HTML file.');
    }

    // --- DOM Element References ---
    const headerUsername = document.getElementById('headerUsername');

    const recordListContainer = document.getElementById('recordListContainer');
    const recordFormContainer = document.getElementById('recordFormContainer');
    const recordDetailContainer = document.getElementById('recordDetailContainer');
    const followUpFormContainer = document.getElementById('followUpFormContainer');
    const followUpModal = document.getElementById('followUpModal');
    const pdfModal = document.getElementById('pdfModal');
    const pdfViewerIframe = document.getElementById('pdfViewerIframe');
    const closePdfModal = document.getElementById('closePdfModal');

    // Reference to the bottom-left image container
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
    const selectedRecordPdfsDisplay = document.getElementById('selectedRecordPdfsDisplay');

    const sortOrderSelect = document.getElementById('sortOrder');
    const recordsList = document.getElementById('recordsList');
    const noRecordsMessage = document.querySelector('.no-records-message');

    const detailPatientName = document.getElementById('detailPatientName');
    const detailAppointmentDate = document.getElementById('detailAppointmentDate');
    const detailRecordRelate = document.getElementById('detailRecordRelate');
    const detailMedicalRecord = document.getElementById('detailMedicalRecord');

    const pdfsDisplayArea = document.getElementById('pdfsDisplayArea');
    const recordPdfsList = document.getElementById('recordPdfsList');
    const noRecordPdfsMessage = document.getElementById('noRecordPdfsMessage');

    const followUpsList = document.getElementById('followUpsList');
    const noFollowUpsMessage = document.querySelector('.no-followups-message');

    const followUpPatientNameTitle = document.getElementById('followUpPatientNameTitle');
    const followUpDateInput = document.getElementById('followUpDate');
    const followUpTextarea = document.getElementById('followUpText');
    const modalFollowUpDate = document.getElementById('modalFollowUpDate');
    const modalFollowUpText = document.getElementById('modalFollowUpText');

    const followUpPdfUploadInput = document.getElementById('followUpPdfUpload');
    const selectedFollowUpPdfsDisplay = document.getElementById('selectedFollowUpPdfsDisplay');

    // --- State Variables ---
    let currentRecordPdfFiles = []; // Array for FileList of the main record
    let currentFollowupPdfFiles = []; // Array for FileList of the follow-up

    let prontuarios = [];
    let currentRecordId = null;
    let currentPatientName = '';

    const currentUser = "Luciana Viana"; // Hardcoded user for local storage key

    // --- Helper Functions ---

    // Converts a Data URL to a Blob object
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

    // Formats a date string from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Generates a unique ID
    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // --- Container Display/Hide Functions ---

    // Hides all main content containers and shows the specified one
    const showContainer = (container) => {
        const allContainers = [recordListContainer, recordFormContainer, recordDetailContainer, followUpFormContainer];
        allContainers.forEach(c => {
            if (c.style.display === 'block') {
                c.classList.remove('animated-show');
                c.classList.add('animated-hide');
                c.addEventListener('animationend', function handler() {
                    c.style.display = 'none';
                    c.classList.remove('animated-hide');
                    c.removeEventListener('animationend', handler);
                }, { once: true }); // Use once: true to remove listener after first animation
            } else {
                c.style.display = 'none';
                c.classList.remove('animated-show', 'animated-hide');
            }
        });

        // Hide the bottom-left image by default when switching containers
        if (bottomLeftImageContainer) {
            bottomLeftImageContainer.style.display = 'none';
        }

        // Slight delay to allow hide animation to start (optional, can be adjusted)
        setTimeout(() => {
            container.style.display = 'block';
            container.classList.add('animated-show');

            // Show the image only if the record list is visible
            if (container === recordListContainer && bottomLeftImageContainer) {
                bottomLeftImageContainer.style.display = 'block';
            }
        }, 50); // Small delay
    };

    const showList = () => {
        showContainer(recordListContainer);
        renderProntuarios();
    };

    const showNewRecordForm = () => {
        patientNameInput.value = '';
        recordRelateInput.value = '';
        appointmentDateInput.value = new Date().toISOString().split('T')[0]; // Set today's date
        medicalRecordInput.value = '';

        // Reset PDF inputs and displays
        pdfUploadInput.value = '';
        selectedRecordPdfsDisplay.textContent = '';
        currentRecordPdfFiles = []; // Clear the file array

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

        renderRecordPdfs(record.recordPdfs);
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

        // Clear PDF upload field and display
        followUpPdfUploadInput.value = '';
        selectedFollowUpPdfsDisplay.textContent = '';
        currentFollowupPdfFiles = []; // Clear the file array

        showContainer(followUpFormContainer);
    };

    const showFollowUpModal = (date, text, pdfs) => {
        modalFollowUpDate.textContent = `Acompanhamento de: ${date}`;
        modalFollowUpText.innerHTML = text; // Use innerHTML to allow buttons/links

        // Clear any previous PDF buttons in the modal
        const existingPdfButtons = modalFollowUpText.querySelectorAll('.view-pdf-button');
        existingPdfButtons.forEach(btn => btn.remove());

        // If there are PDFs in the follow-up, add buttons to view them in the modal
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
                viewPdfInModalButton.style.marginRight = '10px';
                viewPdfInModalButton.onclick = (e) => {
                    e.stopPropagation(); // Prevents clicking this button from closing the parent modal
                    openPdfModal(pdf.dataUrl);
                };
                modalFollowUpText.appendChild(viewPdfInModalButton);
            });
        }
        followUpModal.style.display = 'flex';
    };

    const hideFollowUpModal = () => {
        followUpModal.style.display = 'none';
        // Clear PDF button from the modal for the next follow-up
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
        pdfViewerIframe.src = ''; // Clear iframe src
        if (currentSrc.startsWith('blob:')) {
            URL.revokeObjectURL(currentSrc); // Revoke blob URL to free memory
        }
    };

    // --- Data Management (LocalStorage) per user ---

    const USER_LOCAL_STORAGE_KEY = `prontuariosApp_${currentUser}Prontuarios`;

    const getProntuariosForCurrentUser = () => {
        return JSON.parse(localStorage.getItem(USER_LOCAL_STORAGE_KEY) || '[]');
    };

    const saveProntuariosForCurrentUser = (userProntuarios) => {
        localStorage.setItem(USER_LOCAL_STORAGE_KEY, JSON.stringify(userProntuarios));
    };

    const loadProntuarios = () => {
        prontuarios = getProntuariosForCurrentUser();
    };

    const saveProntuarios = () => {
        saveProntuariosForCurrentUser(prontuarios);
    };

    // --- Rendering Functions ---

    const renderProntuarios = () => {
        recordsList.innerHTML = '';

        if (prontuarios.length === 0) {
            // Ensure message is appended if not already, and displayed
            if (!recordsList.contains(noRecordsMessage)) {
                recordsList.appendChild(noRecordsMessage);
            }
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

            // Prepare summary for initial symptom, truncating if too long
            const initialSymptomSummary = record.recordRelate
                ? (record.recordRelate.length > 100 ? record.recordRelate.substring(0, 100) + '...' : record.recordRelate)
                : 'Sem sintoma inicial.';

            // --- MODIFIED: Simplified display on main list ---
            li.innerHTML =
                `<div class="record-item-info">
                    <h3>${record.patientName}</h3>
                    <p><strong>Início:</strong> ${formatDate(record.appointmentDate)}</p>
                    <p><strong>Sintoma Inicial:</strong> ${initialSymptomSummary}</p>
                </div>
                <div class="record-item-actions">
                    <button class="action-button view-button" data-id="${record.id}">Ver Detalhes</button>
                    <button class="action-button delete-record-item-button" data-id="${record.id}">Excluir</button>
                </div>`;
            // --- END MODIFIED ---

            recordsList.appendChild(li);
        });

        // Event delegation for view and delete buttons on the list
        // Attaching listeners here means they are re-attached every render, which is fine for small lists
        // For very large lists, consider delegating to `recordsList` directly.
        document.querySelectorAll('.view-button').forEach(button => {
            button.onclick = ({ target }) => {
                const id = target.dataset.id;
                const record = prontuarios.find(p => p.id === id);
                if (record) {
                    showRecordDetails(record);
                }
            };
        });

        document.querySelectorAll('.delete-record-item-button').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation(); // Prevents the parent li click from firing
                const idToDelete = e.target.dataset.id;
                deleteProntuario(idToDelete);
            };
        });
    };

    // Renders PDFs attached to the main record in the detail view
    const renderRecordPdfs = (pdfs) => {
        recordPdfsList.innerHTML = ''; // Clear existing list

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

        // Add event listeners for the newly created PDF buttons
        recordPdfsList.querySelectorAll('.view-pdf-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const pdfUrl = event.currentTarget.dataset.pdfUrl;
                if (pdfUrl) {
                    openPdfModal(pdfUrl);
                }
            });
        });
    };

    // Renders follow-up entries for a record
    const renderFollowUps = (followUps) => {
        followUpsList.innerHTML = '';
        if (followUps.length === 0) {
            // Ensure message is appended if not already, and displayed
            if (!followUpsList.contains(noFollowUpsMessage)) {
                followUpsList.appendChild(noFollowUpsMessage);
            }
            noFollowUpsMessage.style.display = 'block';
            return;
        } else {
            noFollowUpsMessage.style.display = 'none';
        }

        followUps.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        followUps.forEach((f, index) => {
            const li = document.createElement('li');
            li.className = 'followup-item';
            li.dataset.index = index; // Add index as data attribute for deletion

            // Build links for multiple follow-up PDFs
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

            // Event listener for the entire LI to open text modal (excluding PDF links and delete button)
            li.onclick = (e) => {
                if (!e.target.closest('.view-followup-pdf') && !e.target.closest('.delete-followup-button')) {
                    showFollowUpModal(formatDate(f.date), f.text, f.pdfs);
                }
            };
            followUpsList.appendChild(li);
        });

        // Add event listeners for PDF links and delete buttons (delegating if many are added)
        document.querySelectorAll('.view-followup-pdf').forEach(link => {
            link.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevents the follow-up text modal from opening
                const pdfUrl = event.currentTarget.dataset.pdfUrl;
                if (pdfUrl) {
                    openPdfModal(pdfUrl);
                }
            });
        });

        document.querySelectorAll('.delete-followup-button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevents the follow-up text modal from opening
                const li = event.currentTarget.closest('.followup-item');
                if (li) {
                    const followUpIndex = parseInt(li.dataset.index);
                    deleteFollowUp(currentRecordId, followUpIndex);
                }
            });
        });
    };

    // --- Action Functions ---

    // Saves a new medical record (prontuario)
    const saveProntuario = async () => {
        const patientName = patientNameInput.value.trim();
        const recordRelate = recordRelateInput.value.trim();
        const appointmentDate = appointmentDateInput.value;
        const medicalRecord = medicalRecordInput.value.trim();

        if (!patientName || !appointmentDate) {
            alert('Por favor, preencha Nome do Paciente e Data do Atendimento.');
            return;
        }

        // Process multiple PDFs for the main record
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
            recordPdfs: recordPdfsToSave, // Array of {dataUrl, fileName} objects
            lastModified: new Date().toLocaleDateString('pt-BR'),
            followUps: []
        };

        prontuarios.push(newProntuario);
        saveProntuarios();
        showList();
    };

    // Deletes a medical record
    const deleteProntuario = (idToDelete) => {
        if (confirm('Tem certeza que deseja excluir este prontuário? Esta ação não pode ser desfeita.')) {
            prontuarios = prontuarios.filter(p => p.id !== idToDelete);
            saveProntuarios();
            showList();
        }
    };

    // Deletes a specific follow-up from a record
    const deleteFollowUp = (recordId, followUpIndex) => {
        const record = prontuarios.find(p => p.id === recordId);
        if (!record) return;

        if (confirm('Tem certeza que deseja excluir este acompanhamento? Esta ação não pode ser desfeita.')) {
            record.followUps.splice(followUpIndex, 1); // Remove follow-up by index

            record.lastModified = new Date().toLocaleDateString('pt-BR'); // Update record's last modified date
            saveProntuarios();

            showRecordDetails(record); // Re-render follow-up list to reflect deletion

            alert('Acompanhamento excluído com sucesso.');
        }
    };

    // Saves a new follow-up for the current record
    const saveFollowUp = async () => {
        const followUpDate = followUpDateInput.value;
        const followUpText = followUpTextarea.value.trim();

        const recordToUpdate = prontuarios.find(p => p.id === currentRecordId);
        if (!recordToUpdate) {
            alert('Erro: Prontuário não encontrado.');
            showList();
            return;
        }

        // Process multiple PDFs for the follow-up
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
            pdfs: followUpPdfsToSave // Array of {dataUrl, fileName} objects
        });
        recordToUpdate.lastModified = new Date().toLocaleDateString('pt-BR');
        saveProntuarios();
        showRecordDetails(recordToUpdate);
    };

    // --- Sorting Functions ---
    const sortProntuarios = (arr, sortOrder) => {
        switch (sortOrder) {
            case 'lastModifiedDesc':
                return [...arr].sort((a, b) => {
                    // Convert DD/MM/YYYY to YYYY-MM-DD for correct date comparison
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
    closePdfModal.addEventListener('click', closePdfModalHandler);

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target === followUpModal) {
            hideFollowUpModal();
        }
        if (event.target === pdfModal) {
            closePdfModalHandler();
        }
    });

    // Event listener for the main record PDF input (multiple files)
    pdfUploadInput.addEventListener('change', (event) => {
        // Filter to ensure only PDFs are added
        const files = Array.from(event.target.files).filter(file => file.type === 'application/pdf');

        if (files.length > 0) {
            currentRecordPdfFiles = files;
            const fileNames = files.map(file => file.name).join(', ');
            selectedRecordPdfsDisplay.textContent = `Arquivo(s) selecionado(s): ${fileNames}`;
        } else {
            currentRecordPdfFiles = [];
            pdfUploadInput.value = ''; // Clear the input field
            selectedRecordPdfsDisplay.textContent = 'Nenhum arquivo PDF selecionado ou arquivos inválidos.';
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    });

    // Event listener for the follow-up PDF input (multiple files)
    followUpPdfUploadInput.addEventListener('change', (event) => {
        // Filter to ensure only PDFs are added
        const files = Array.from(event.target.files).filter(file => file.type === 'application/pdf');

        if (files.length > 0) {
            currentFollowupPdfFiles = files;
            const fileNames = files.map(file => file.name).join(', ');
            selectedFollowUpPdfsDisplay.textContent = `Arquivo(s) selecionado(s): ${fileNames}`;
        } else {
            currentFollowupPdfFiles = [];
            followUpPdfUploadInput.value = ''; // Clear the input field
            selectedFollowUpPdfsDisplay.textContent = 'Nenhum arquivo PDF selecionado ou arquivos inválidos.';
            alert('Por favor, selecione apenas arquivos PDF.');
        }
    });

    // --- Initialization ---
    // Set the username in the header
    if (headerUsername) {
        headerUsername.textContent = currentUser;
    }
    loadProntuarios();
    showList(); // Show the list initially
});