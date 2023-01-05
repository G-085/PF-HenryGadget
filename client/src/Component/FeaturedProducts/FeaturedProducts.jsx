import React from 'react'
import EffectCubes from './EffectCubes'
import 'aos/dist/aos.css'
function FeaturedProducts() {
  return (
    <div
      data-aos='flip-down'
      data-aos-offset='-200'
      data-aos-duration='1300'
      data-aos-once='true'
      style={{
        maxWidth: '100vw',
        height: 'auto',
        backgroundColor: 'rgb(242,242,242)',
        paddingBottom: '2rem'
      }}>
      <h1 style={{ margin: '2.5rem', fontSize: '4rem' }}>Feautered Products</h1>
      <div style={{ width: '50%', margin: 'auto' }}>
        <EffectCubes></EffectCubes>
      </div>
    </div>
  )
}

export default FeaturedProducts