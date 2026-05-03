export const keys = {};

function setupInputs() {

    document.addEventListener("keydown", e => {

        keys[e.code] = true;

        if (
            [
                "Space",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight"
            ].includes(e.code)
        ) {
            e.preventDefault();
        }

    });


    document.addEventListener("keyup", e => {

        keys[e.code] = false;

    });

}