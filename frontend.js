import { generatePoster } from 'backend/poster.web';
import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    const form = $w("#form3");

    form.onSubmit(async (formValues) => {
        try {
            $w("#loading").show();
            // ✅ All image URLs for CMS saving
            const petImages = (formValues.file_upload_9447 || []).map(file => file.url);

            // ✅ First image for poster generation
            const firstImage = (formValues.file_upload_9447 && formValues.file_upload_9447.length > 0) ?
                formValues.file_upload_9447[0].url :
                null;

            const submissionData = {
                ownerName: `${formValues.first_name_2135} ${formValues.last_name_a8f9}`,
                phone: formValues.phone_number,
                petName: formValues.my_pet_responds_to,
                petType: formValues.pet_type,
                breed: formValues.breed,
                comments: formValues.additional_comments,
                registrationStatus: formValues.is_your_pet_registered_micro_chipped_or_tagged,
                registrationDetails: formValues.if_yes_please_provide_the_registration_details_below,
                landmark: formValues.landmark_if_any_2,
                city: formValues.multi_line_address_a3b3?.city,
                state: formValues.multi_line_address_a3b3?.subdivision,
                images: petImages // For CMS
            };

            console.log("Lost Pet Submission:", submissionData);

            // ✅ Prepare poster data with correct field names
            const posterData = {
                name: submissionData.petName,
                breed: submissionData.breed,
                regDetails: submissionData.registrationDetails,
                features: submissionData.comments,
                lastSeenCity: submissionData.city,
                lastSeenArea: submissionData.landmark, // Adjust if your form has a specific field
                landmark: submissionData.landmark,
                phoneNumber: submissionData.phone,
                imageUrl: firstImage
            };

            const response = await generatePoster(posterData);

            if (response.success) {
                $w("#loading").hide();
                console.log("Poster Created:", response.downloadUrl);

                // ✅ Ensure CMS field names match exactly (e.g., 'dogimages' lowercase)
                const cmsData = {
                    ownerName: submissionData.ownerName,
                    phone: submissionData.phone,
                    petName: submissionData.petName,
                    petType: submissionData.petType,
                    breed: submissionData.breed,
                    distinctFeatures: submissionData.comments,
                    registrationStatus: submissionData.registrationStatus,
                    registrationDetails: submissionData.registrationDetails,
                    landmark: submissionData.landmark,
                    city: submissionData.city,
                    state: submissionData.state,
                    dogImages: submissionData.images, // Lowercase to match CMS field
                    poster: response.file
                };

                await wixData.insert("LostPetData", cmsData);
                console.log("Data saved to CMS:", cmsData);

                await wixLocationFrontend.to(response.downloadUrl);
            } else {
                console.error("Poster generation failed:", response.error);
            }

            return form.submit();
        } catch (error) {
            console.error("Form submission error:", error);
        }
    });
});