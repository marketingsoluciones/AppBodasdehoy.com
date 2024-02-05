import { TagsInput } from "react-tag-input-component";

export const FormAddUserToEvent = ({ setUsers, optionsExist }) => {
    const handleSubmit = (selectedOption) => {
        setUsers(selectedOption)
    }

    const beforeAddValidate = (tag) => {
        const validator = []
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        validator.push(regex.test(tag) ? true : false)
        validator.push(optionsExist.includes(tag) ? false : true)
        return !validator.includes(false)
    }

    return (
        <div className={`flex flex-col space-y-1 mb-5 md:mb-0`}>
            <label className="text-primary">Agregar nuevo usuario</label>
            <TagsInput
                onChange={handleSubmit}
                name="emails"
                placeHolder="correo@email.com"
                beforeAddValidate={beforeAddValidate}
                separators={["Enter", ",", " ", ";"]}
                classNames={{
                    tag: "!text-sm !px-2 !rounded-lg",
                    input: "!w-full !text-sm !rounded-lg"
                }}
            />
            <style>{`
                .rti--container {
                    --rti-s: .2rem;
                    --rti-radius: 0.75rem;
                    }
              
            ` }</style>
        </div>
    )
}