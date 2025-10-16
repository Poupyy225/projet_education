import os
import sys

# Ajouter le chemin actuel
sys.path.append(os.path.dirname(__file__))

try:
    from app import app
    print("✅ Application importée avec succès")
    print("🚀 Démarrage sur http://localhost:5000")
    
    if __name__ == '__main__':
        app.run(debug=True, host='0.0.0.0', port=5000)
        
except Exception as e:
    print(f"❌ Erreur: {e}")
    print("🔍 Détails de l'erreur :")
    import traceback
    traceback.print_exc()