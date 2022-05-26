import React from 'react'

const BlockTitle = ({title}) => {
    return (
        <div className="w-full bg-white rounded-xl shadow-lg">
        <h1 className="font-display font-semibold text-2xl text-gray-500 p-3 px-6">
          {title}
        </h1>
      </div>
    )
}

export default React.memo(BlockTitle)
