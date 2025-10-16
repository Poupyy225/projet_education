document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = '☀️ Mode clair';
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.textContent = isDark ? '☀️ Mode clair' : '🌙 Mode sombre';
        });
    }

    const btnRunTest = document.getElementById('btnRunTest');
    const testSelect = document.getElementById('testSelect');
    const btnSampleData = document.getElementById('btnSampleData');
    const btnUpload = document.getElementById('btnUpload');
    const fileInput = document.getElementById('fileInput');
    const resultsContainer = document.getElementById('resultsContainer');

    // Gestion de la sélection du test
    if (testSelect) {
        testSelect.addEventListener('change', function() {
            if (btnRunTest) {
                btnRunTest.disabled = !this.value;
            }
        });
    }

    // Chargement des données d'exemple
    if (btnSampleData) {
        btnSampleData.addEventListener('click', function() {
            showLoading('Chargement des données d\'exemple...');
            setTimeout(() => {
                showSuccess('Données d\'exemple chargées avec succès!');
            }, 1000);
        });
    }

    // Upload de fichier
    if (btnUpload) {
        btnUpload.addEventListener('click', function() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Veuillez sélectionner un fichier CSV');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            showLoading('Traitement du fichier...');

            fetch('/upload_data', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateDataPreview(data.preview, data.colonnes);
                    showSuccess('Fichier importé avec succès!');
                } else {
                    showError(data.error);
                }
            })
            .catch(error => {
                showError('Erreur lors de l\'upload: ' + error);
            });
        });
    }

    // Exécution du test
    if (btnRunTest) {
        btnRunTest.addEventListener('click', function() {
            const testType = testSelect.value;
            if (!testType) return;

            showLoading('Exécution du test en cours...');

            fetch('/executer_test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    test_type: testType
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayResults(data.resultats);
                } else {
                    showError(data.error);
                }
            })
            .catch(error => {
                showError('Erreur: ' + error);
            });
        });
    }

    // Fonctions d'affichage
    function showLoading(message) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2">${message}</p>
                </div>
            `;
        }
    }

    function showSuccess(message) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-success">
                    ✅ ${message}
                </div>
            `;
        }
    }

    function showError(message) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    ❌ ${message}
                </div>
            `;
        }
    }

    function displayResults(resultats) {
        let html = `
            <div class="result-card">
                <h4>Test: ${resultats.test}</h4>
                <div class="row mt-3">
        `;

        if (resultats.statistique !== undefined) {
            html += `
                <div class="col-md-6">
                    <p><strong>Statistique:</strong> <span class="stat-value">${resultats.statistique.toFixed(4)}</span></p>
                </div>
            `;
        }

        if (resultats.correlation !== undefined) {
            html += `
                <div class="col-md-6">
                    <p><strong>Corrélation:</strong> <span class="stat-value">${resultats.correlation.toFixed(4)}</span></p>
                </div>
            `;
        }

        html += `
                    <div class="col-md-6">
                        <p><strong>p-value:</strong> <span class="stat-value">${resultats.p_value.toFixed(6)}</span></p>
                    </div>
                </div>
                <div class="interpretation">
                    <strong>Interprétation:</strong> ${resultats.interpretation}
                </div>
            </div>
        `;

        if (resultats.graphique) {
            html += `
                <div class="mt-4">
                    <h5>Visualisation</h5>
                    <img src="data:image/png;base64,${resultats.graphique}" 
                         class="img-fluid rounded" alt="Graphique des résultats">
                </div>
            `;
        }

        html += `
            <div class="mt-3">
                <button class="btn btn-outline-primary" onclick="showDetailedResults()">
                    Voir les détails techniques
                </button>
            </div>
        `;

        if (resultsContainer) {
            resultsContainer.innerHTML = html;
        }
        
        // Stocker les résultats pour le modal
        window.currentResults = resultats;
    }

    function updateDataPreview(data, columns) {
        const previewDiv = document.getElementById('dataPreview');
        if (!previewDiv) return;

        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `<td>${row[col]}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="text-muted">${data.length} lignes affichées</p>
        `;
        previewDiv.innerHTML = tableHtml;
    }
});

// Fonction globale pour le modal
function showDetailedResults() {
    const results = window.currentResults;
    if (!results) return;

    const modalContent = document.getElementById('modalResultsContent');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <h6>Résultats Techniques</h6>
        <pre class="bg-light p-3 rounded">${JSON.stringify(results, null, 2)}</pre>
        
        <h6 class="mt-3">Guide d'Interprétation</h6>
        <div class="alert alert-info">
            <strong>p-value < 0.05:</strong> Rejet de l'hypothèse nulle - effet statistiquement significatif<br>
            <strong>p-value ≥ 0.05:</strong> Pas de preuve suffisante pour rejeter l'hypothèse nulle
        </div>
    `;

    // Initialiser le modal Bootstrap
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
}