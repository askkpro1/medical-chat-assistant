-- Sample symptom knowledge entries (optional)
-- These can be used for semantic search and better responses

insert into symptom_knowledge (symptom, response) values
(
    'headache and fever',
    'Headaches combined with fever can indicate various conditions including viral infections, flu, or other illnesses. Rest, stay hydrated, and consider over-the-counter pain relievers if appropriate. If fever is high (over 101.3°F/38.5°C) or symptoms worsen, seek medical attention promptly.'
),
(
    'chest pain',
    'Chest pain should always be taken seriously as it can indicate heart problems, lung issues, or other serious conditions. If you experience severe chest pain, pain radiating to arms/jaw/back, shortness of breath, or sweating, seek emergency medical care immediately. For mild chest discomfort, still consult with a healthcare provider.'
),
(
    'persistent cough',
    'A persistent cough lasting more than 2-3 weeks should be evaluated by a healthcare provider. It could indicate respiratory infections, allergies, asthma, or other conditions. Stay hydrated, avoid irritants, and consider seeing a doctor if the cough is accompanied by fever, blood, or difficulty breathing.'
),
(
    'stomach pain and nausea',
    'Stomach pain with nausea can result from various causes including food poisoning, gastritis, stress, or other digestive issues. Try clear fluids, bland foods (BRAT diet), and rest. Seek medical attention if pain is severe, persistent, or accompanied by vomiting, fever, or signs of dehydration.'
);
