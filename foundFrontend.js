import { generatePoster } from 'backend/foundposter.web';
import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    const form = $w("#form3");

    form.onSubmit(async (formValues) => {
        $w("#loading").show();
        try {
            // ✅ All image URLs for CMS saving
            const petImages = (formValues.file_upload_9447 || []).map(file => file.url);

            // ✅ First image for poster generation
            const firstImage = (formValues.file_upload_9447 && formValues.file_upload_9447.length > 0)
                ? formValues.file_upload_9447[0].url
                : null;

            const submissionData = {
                foundersName: `${formValues.first_name_2135} ${formValues.last_name_a8f9}`,
                findersPhone: formValues.phone_number,
                petName: formValues.my_pet_responds_to,
                type: formValues.pet_type,
                breed: formValues.breed,
                distinctFeatures: formValues.additional_comments,
                registrationNumber: formValues.registration_details,
                foundWhere: formValues.landmark_if_any_2,
                city: formValues.multi_line_address_a3b3?.city,
                state: formValues.multi_line_address_a3b3?.subdivision,
                images: petImages
            };

            console.log("Found Pet Submission:", submissionData);

            // ✅ Prepare poster data (adjust if backend requirements differ)
            const posterData = {
                name: submissionData.petName,
                breed: submissionData.breed,
                regDetails: submissionData.registrationNumber,
                features: submissionData.distinctFeatures,
                lastSeenCity: submissionData.city,
                landmark: submissionData.foundWhere,
                phoneNumber: submissionData.findersPhone,
                imageUrl: firstImage
            };

            const response = await generatePoster(posterData);

            if (response.success) {
                      $w("#loading").hide();
                console.log("Poster Created:", response.downloadUrl);

                // ✅ Map to Found PetData collection schema
                const cmsData = {
                    foundersName: submissionData.foundersName,
                    findersPhone: submissionData.findersPhone,
                    petName: submissionData.petName,
                    type: submissionData.type,
                    breed: submissionData.breed,
                    distinctFeatures: submissionData.distinctFeatures,
                    registrationNumber: submissionData.registrationNumber,
                    foundWhere: submissionData.foundWhere,
                    city: submissionData.city,
                    state: submissionData.state,
                    petImage: submissionData.images,
                    posterPdf: response.fileUrl
                };

                await wixData.insert("FoundPetData", cmsData);
                console.log("Data saved to CMS:", cmsData);
                wixLocationFrontend.to(response.downloadUrl);
            } else {
                console.error("Poster generation failed:", response.error);
            }

            return form.submit();
        } catch (error) {
            console.error("Form submission error:", error);
        }
    });
});