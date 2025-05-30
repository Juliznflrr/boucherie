// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/api/commande', (req, res) => {
    const order = req.body;
    // Ajout d'un id unique si absent
    if (!order.id) {
        order.id = Date.now();
    }
    fs.readFile('config.json', 'utf8', (err, data) => {
        let orders = [];
        if (!err && data) {
            try {
                orders = JSON.parse(data);
            } catch (e) {
                console.error('Erreur JSON existant', e);
            }
        }
        orders.push(order);
        fs.writeFile('config.json', JSON.stringify(orders, null, 2), (err) => {
            if (err) {
                console.error('Erreur d\'écriture', err);
                return res.status(500).send('Erreur serveur');
            }
            res.status(200).send('Commande enregistrée');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

app.use(express.static('public'));
///
app.get('/api/commandes', (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture config.json', err);
            return res.status(500).send('Erreur serveur');
        }

        try {
            const commandes = JSON.parse(data);
            res.json(commandes);
        } catch (e) {
            console.error('Erreur parsing commandes', e);
            res.status(500).send('Erreur de données');
        }
    });
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    fs.readFile('admin.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture admin.json', err);
            return res.status(500).send('Erreur serveur');
        }
        const adminUser = JSON.parse(data);
        if (email === adminUser.email && password === adminUser.password) {
            res.status(200).send('Authentification réussie');
        } else {
            res.status(401).send('Identifiants incorrects');
        }
    });
});

app.get('/download-commandes', (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture config.json', err);
            return res.status(500).send('Erreur serveur');
        }
        let orders = [];
        try {
            orders = JSON.parse(data);
        } catch (e) {
            console.error('Erreur parsing config.json', e);
            return res.status(500).send('Erreur de données');
        }

        let csv = 'Date,Nom,Email,Téléphone,Produits\n';
        orders.forEach(order => {
            const products = order.cart.map(item => `${item.name} (${item.quantity})`).join('; ');
            csv += `${order.date},"${order.customerInfo.name}","${order.customerInfo.email}","${order.customerInfo.phone}","${products}"\n`;
        });

        res.setHeader('Content-Disposition', 'attachment; filename=commandes.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    });
});

app.get('/api/produits', (req, res) => {
    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture produits.json', err);
            return res.status(500).send('Erreur serveur');
        }

        try {
            const produits = JSON.parse(data);
            res.json(produits);
        } catch (e) {
            console.error('Erreur parsing produits', e);
            res.status(500).send('Erreur de données');
        }
    });
});

app.post('/api/produit', (req, res) => {
    const newProduct = req.body;
    // Ajout d'une valeur par défaut pour priceType
    if (!newProduct.priceType) {
        newProduct.priceType = 'piece';
    }
    fs.readFile('products.json', 'utf8', (err, data) => {
        let products = [];
        if (!err && data) {
            try {
                products = JSON.parse(data);
            } catch (e) {
                console.error('Erreur parsing products.json', e);
            }
        }
        // Affecter un nouvel ID unique
        newProduct.id = Date.now();
        products.push(newProduct);
        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) {
                console.error('Erreur d\'écriture du produit', err);
                return res.status(500).send('Erreur serveur');
            }
            res.status(200).send('Produit ajouté avec succès');
        });
    });
});

// New: Endpoint to delete a product
app.delete('/api/produits/:id', (req, res) => {
    const productId = parseInt(req.params.id);

    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture products.json', err);
            return res.status(500).send('Erreur serveur');
        }

        let products = [];
        try {
            products = JSON.parse(data);
        } catch (e) {
            console.error('Erreur parsing products.json', e);
            return res.status(500).send('Erreur de données');
        }

        const initialLength = products.length;
        products = products.filter(p => p.id !== productId);

        if (products.length === initialLength) {
            return res.status(404).send('Produit non trouvé');
        }

        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) {
                console.error('Erreur d\'écriture après suppression', err);
                return res.status(500).send('Erreur serveur');
            }
            res.status(200).send('Produit supprimé avec succès');
        });
    });
});

// New: Endpoint to update a product
app.put('/api/produits/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const updatedProduct = req.body;

    fs.readFile('products.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture products.json', err);
            return res.status(500).send('Erreur serveur');
        }

        let products = [];
        try {
            products = JSON.parse(data);
        } catch (e) {
            console.error('Erreur parsing products.json', e);
            return res.status(500).send('Erreur de données');
        }

        const index = products.findIndex(p => p.id === productId);

        if (index === -1) {
            return res.status(404).send('Produit non trouvé');
        }

        // Keep the original ID
        updatedProduct.id = productId;
        products[index] = updatedProduct;

        fs.writeFile('products.json', JSON.stringify(products, null, 2), (err) => {
            if (err) {
                console.error('Erreur d\'écriture après modification', err);
                return res.status(500).send('Erreur serveur');
            }
            res.status(200).send('Produit modifié avec succès');
        });
    });
});

// Endpoint pour supprimer une commande
app.delete('/api/commandes/:id', (req, res) => {
    const commandeId = parseInt(req.params.id);
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture config.json', err);
            return res.status(500).send('Erreur serveur');
        }
        let commandes = [];
        try {
            commandes = JSON.parse(data);
        } catch (e) {
            console.error('Erreur parsing config.json', e);
            return res.status(500).send('Erreur de données');
        }
        const initialLength = commandes.length;
        commandes = commandes.filter(c => c.id !== commandeId);
        if (commandes.length === initialLength) {
            return res.status(404).send('Commande non trouvée');
        }
        fs.writeFile('config.json', JSON.stringify(commandes, null, 2), (err) => {
            if (err) {
                console.error('Erreur d\'écriture après suppression commande', err);
                return res.status(500).send('Erreur serveur');
            }
            res.status(200).send('Commande supprimée avec succès');
        });
    });
});

// Endpoint pour supprimer toutes les commandes
app.delete('/api/commandes', (req, res) => {
    fs.writeFile('config.json', '[]', (err) => {
        if (err) {
            console.error('Erreur lors de la suppression de toutes les commandes', err);
            return res.status(500).send('Erreur serveur');
        }
        res.status(200).send('Toutes les commandes supprimées');
    });
});

// Endpoint pour exporter les commandes en PDF
app.get('/download-commandes-pdf', (req, res) => {
    const day = (req.query.day || '').toLowerCase();
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lecture config.json', err);
            return res.status(500).send('Erreur serveur');
        }
        let commandes = [];
        try {
            commandes = JSON.parse(data);
        } catch (e) {
            console.error('Erreur parsing config.json', e);
            return res.status(500).send('Erreur de données');
        }
        if (day && day !== 'all') {
            commandes = commandes.filter(c => (c.pickupDay || '').toLowerCase() === day);
        }
        res.setHeader('Content-Disposition', 'attachment; filename=commandes.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        const doc = new PDFDocument();
        doc.pipe(res);
        doc.fontSize(18).text('Liste des Commandes', {align: 'center'});
        doc.moveDown();
        commandes.forEach((commande, idx) => {
            doc.fontSize(14).text(`Commande #${idx + 1}`);
            doc.fontSize(12).text(`Nom: ${commande.name || ''}`);
            doc.text(`Email: ${commande.email || ''}`);
            doc.text(`Téléphone: ${commande.phone || ''}`);
            doc.text(`Adresse: ${commande.address || ''}`);
            doc.text(`Jour de retrait: ${commande.pickupDay || ''}`);
            doc.text(`Date: ${commande.date ? new Date(commande.date).toLocaleString() : ''}`);
            doc.text('Produits:');
            (commande.items || []).forEach(item => {
                doc.text(`- ${item.name || ''} (${item.quantity || 1} x ${item.price || 0} €)`);
            });
            doc.text(`Total: ${commande.total || ''} €`);
            doc.moveDown();
        });
        doc.end();
    });
});

