from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

# Données d'exemple intégrées
def generate_sample_data():
    np.random.seed(42)
    data = {
        'groupe': ['A'] * 30 + ['B'] * 30 + ['C'] * 30,
        'valeur': np.concatenate([
            np.random.normal(50, 15, 30),
            np.random.normal(65, 12, 30),
            np.random.normal(45, 18, 30)
        ]),
        'score': np.random.randint(1, 10, 90),
        'temps': np.random.exponential(2, 90)
    }
    return pd.DataFrame(data)

# Tests statistiques non paramétriques
def perform_wilcoxon_test(data1, data2):
    stat, p_value = stats.wilcoxon(data1, data2)
    return {
        'test': 'Wilcoxon',
        'statistique': stat,
        'p_value': p_value,
        'interpretation': interpret_p_value(p_value)
    }

def perform_mann_whitney_test(data1, data2):
    stat, p_value = stats.mannwhitneyu(data1, data2)
    return {
        'test': 'Mann-Whitney',
        'statistique': stat,
        'p_value': p_value,
        'interpretation': interpret_p_value(p_value)
    }

def perform_kruskal_wallis_test(groups):
    stat, p_value = stats.kruskal(*groups)
    return {
        'test': 'Kruskal-Wallis',
        'statistique': stat,
        'p_value': p_value,
        'interpretation': interpret_p_value(p_value)
    }

def perform_spearman_test(data1, data2):
    corr, p_value = stats.spearmanr(data1, data2)
    return {
        'test': 'Spearman',
        'correlation': corr,
        'p_value': p_value,
        'interpretation': interpret_p_value(p_value)
    }

def perform_friedman_test(data):
    stat, p_value = stats.friedmanchisquare(*data)
    return {
        'test': 'Friedman',
        'statistique': stat,
        'p_value': p_value,
        'interpretation': interpret_p_value(p_value)
    }

def interpret_p_value(p_value):
    if p_value < 0.001:
        return "Différence très significative (p < 0.001)"
    elif p_value < 0.01:
        return "Différence significative (p < 0.01)"
    elif p_value < 0.05:
        return "Différence significative (p < 0.05)"
    else:
        return "Différence non significative (p ≥ 0.05)"

def create_plot():
    """Crée un graphique matplotlib et le convertit en base64"""
    img = io.BytesIO()
    plt.figure(figsize=(10, 6))
    
    # Exemple de données pour le graphique
    categories = ['Groupe A', 'Groupe B', 'Groupe C']
    values = [25, 30, 45]
    
    plt.bar(categories, values, color=['#FF6B6B', '#4ECDC4', '#45B7D1'])
    plt.title('Distribution des effectifs par groupe')
    plt.ylabel('Nombre d\'observations')
    plt.grid(axis='y', alpha=0.3)
    
    plt.savefig(img, format='png', bbox_inches='tight', dpi=100)
    plt.close()
    img.seek(0)
    return base64.b64encode(img.getvalue()).decode()

# Routes Flask
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tests')
def tests():
    df = generate_sample_data()
    colonnes = df.columns.tolist()
    return render_template('tests.html', colonnes=colonnes, donnees=df.head(10).to_dict('records'))

@app.route('/executer_test', methods=['POST'])
def executer_test():
    try:
        data = request.get_json()
        test_type = data['test_type']
        df = generate_sample_data()
        
        resultats = {}
        
        if test_type == 'wilcoxon':
            groupe_a = df[df['groupe'] == 'A']['valeur']
            groupe_b = df[df['groupe'] == 'B']['valeur']
            resultats = perform_wilcoxon_test(groupe_a, groupe_b)
            
        elif test_type == 'mann_whitney':
            groupe_a = df[df['groupe'] == 'A']['valeur']
            groupe_b = df[df['groupe'] == 'B']['valeur']
            resultats = perform_mann_whitney_test(groupe_a, groupe_b)
            
        elif test_type == 'kruskal_wallis':
            groupes = [df[df['groupe'] == g]['valeur'] for g in df['groupe'].unique()]
            resultats = perform_kruskal_wallis_test(groupes)
            
        elif test_type == 'spearman':
            resultats = perform_spearman_test(df['valeur'], df['score'])
            
        elif test_type == 'friedman':
            # Simulation de données pour Friedman
            data_friedman = [
                np.random.normal(50, 10, 30),
                np.random.normal(55, 10, 30),
                np.random.normal(52, 10, 30)
            ]
            resultats = perform_friedman_test(data_friedman)
        
        # Générer un graphique
        plot_url = create_plot()
        resultats['graphique'] = plot_url
        
        return jsonify({'success': True, 'resultats': resultats})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/upload_data', methods=['POST'])
def upload_data():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Aucun fichier sélectionné'})
        
        if file and file.filename.endswith('.csv'):
            df = pd.read_csv(file)
            return jsonify({
                'success': True,
                'colonnes': df.columns.tolist(),
                'preview': df.head(10).to_dict('records')
            })
        else:
            return jsonify({'success': False, 'error': 'Format de fichier non supporté'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/documentation')
def documentation():
    return render_template('documentation.html')

if __name__ == '__main__':
    
    app.run(debug=True)