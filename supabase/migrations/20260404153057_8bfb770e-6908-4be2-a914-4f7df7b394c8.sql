
UPDATE proposal_testimonials 
SET image = '/proposal-assets/Depoimento.png' 
WHERE name = 'Thiago Nigro' AND image IS NULL;

UPDATE orcamentos 
SET testimonial_image = '/proposal-assets/Depoimento.png' 
WHERE testimonial_name = 'Thiago Nigro' AND testimonial_image IS NULL;
